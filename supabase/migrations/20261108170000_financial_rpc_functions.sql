-- Financial management v2 — transactional RPC functions.
--
-- These SECURITY-invoker functions make multi-step financial operations atomic.
-- They run inside a single transaction: either every step succeeds or nothing
-- is persisted, which guarantees balances/reserves never end up half-updated.
--
-- Additive only: creates functions and one helper view; touches no existing
-- rows and drops nothing.

-- ---------------------------------------------------------------------------
-- Consolidated balance per establishment (saldo_inicial + Σ movimentos).
-- Single source of truth — the balance is always derived, never stored.
-- ---------------------------------------------------------------------------

create or replace view public.v_saldos_contas as
select
  c.id,
  c.estabelecimento_id,
  c.nome,
  c.tipo,
  c.ativo,
  c.saldo_inicial_centavos
    + coalesce(sum(case when m.tipo = 'ENTRADA' then m.valor_centavos
                        when m.tipo = 'SAIDA' then -m.valor_centavos
                        else 0 end), 0) as saldo_atual_centavos
from public.contas_financeiras c
left join public.movimentacoes_financeiras m
  on m.conta_id = c.id and m.deleted_at is null
where c.deleted_at is null
group by c.id;

-- ---------------------------------------------------------------------------
-- criar_transferencia — internal transfer between two accounts.
-- Never a revenue/expense: both legs are natureza 'TRANSFERENCIA', so the
-- consolidated balance stays exactly the same.
-- ---------------------------------------------------------------------------

create or replace function public.criar_transferencia(
  p_estabelecimento_id uuid,
  p_conta_origem_id uuid,
  p_conta_destino_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns uuid
language plpgsql
as $$
declare
  v_transferencia_id uuid;
  v_saldo_origem bigint;
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;
  if p_conta_origem_id = p_conta_destino_id then
    raise exception 'conta de origem e destino devem ser diferentes';
  end if;

  -- Guard: the source account must have enough balance.
  select saldo_atual_centavos into v_saldo_origem
  from public.v_saldos_contas
  where id = p_conta_origem_id and estabelecimento_id = p_estabelecimento_id
  for update;
  if v_saldo_origem is null then
    raise exception 'conta de origem nao encontrada';
  end if;
  if v_saldo_origem < p_valor_centavos then
    raise exception 'saldo insuficiente na conta de origem';
  end if;

  insert into public.transferencias
    (estabelecimento_id, conta_origem_id, conta_destino_id, valor_centavos, data_referencia, descricao)
  values
    (p_estabelecimento_id, p_conta_origem_id, p_conta_destino_id, p_valor_centavos, p_data_referencia, p_descricao)
  returning id into v_transferencia_id;

  insert into public.movimentacoes_financeiras
    (estabelecimento_id, conta_id, tipo, natureza, valor_centavos, data_referencia, transferencia_id, descricao)
  values
    (p_estabelecimento_id, p_conta_origem_id, 'SAIDA', 'TRANSFERENCIA', p_valor_centavos, p_data_referencia, v_transferencia_id, p_descricao),
    (p_estabelecimento_id, p_conta_destino_id, 'ENTRADA', 'TRANSFERENCIA', p_valor_centavos, p_data_referencia, v_transferencia_id, p_descricao);

  return v_transferencia_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- aportar_reserva / retirar_reserva — earmark or release money already held.
-- They never change the consolidated balance (reserves are logical only).
-- ---------------------------------------------------------------------------

create or replace function public.aportar_reserva(
  p_estabelecimento_id uuid,
  p_reserva_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns void
language plpgsql
as $$
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;

  update public.reservas_financeiras
  set valor_atual_centavos = valor_atual_centavos + p_valor_centavos
  where id = p_reserva_id
    and estabelecimento_id = p_estabelecimento_id
    and deleted_at is null;
  if not found then raise exception 'reserva nao encontrada'; end if;

  insert into public.movimentacoes_reservas
    (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia, descricao)
  values
    (p_estabelecimento_id, p_reserva_id, 'APORTE', p_valor_centavos, p_data_referencia, p_descricao);
end;
$$;

create or replace function public.retirar_reserva(
  p_estabelecimento_id uuid,
  p_reserva_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns void
language plpgsql
as $$
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;

  update public.reservas_financeiras
  set valor_atual_centavos = valor_atual_centavos - p_valor_centavos
  where id = p_reserva_id
    and estabelecimento_id = p_estabelecimento_id
    and deleted_at is null
    and valor_atual_centavos >= p_valor_centavos;
  if not found then raise exception 'reserva nao encontrada ou saldo insuficiente'; end if;

  insert into public.movimentacoes_reservas
    (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia, descricao)
  values
    (p_estabelecimento_id, p_reserva_id, 'RETIRADA', p_valor_centavos, p_data_referencia, p_descricao);
end;
$$;

-- ---------------------------------------------------------------------------
-- transferir_entre_reservas — move earmarked money between two reserves.
-- The total reserved is unchanged, so the consolidated balance stays the same.
-- ---------------------------------------------------------------------------

create or replace function public.transferir_entre_reservas(
  p_estabelecimento_id uuid,
  p_reserva_origem_id uuid,
  p_reserva_destino_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns void
language plpgsql
as $$
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;
  if p_reserva_origem_id = p_reserva_destino_id then
    raise exception 'reservas de origem e destino devem ser diferentes';
  end if;

  update public.reservas_financeiras
  set valor_atual_centavos = valor_atual_centavos - p_valor_centavos
  where id = p_reserva_origem_id
    and estabelecimento_id = p_estabelecimento_id
    and deleted_at is null
    and valor_atual_centavos >= p_valor_centavos;
  if not found then raise exception 'reserva origem nao encontrada ou saldo insuficiente'; end if;

  update public.reservas_financeiras
  set valor_atual_centavos = valor_atual_centavos + p_valor_centavos
  where id = p_reserva_destino_id
    and estabelecimento_id = p_estabelecimento_id
    and deleted_at is null;
  if not found then raise exception 'reserva destino nao encontrada'; end if;

  insert into public.movimentacoes_reservas
    (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia, contraparte_reserva_id, descricao)
  values
    (p_estabelecimento_id, p_reserva_origem_id, 'TRANSFERENCIA_SAIDA', p_valor_centavos, p_data_referencia, p_reserva_destino_id, p_descricao),
    (p_estabelecimento_id, p_reserva_destino_id, 'TRANSFERENCIA_ENTRADA', p_valor_centavos, p_data_referencia, p_reserva_origem_id, p_descricao);
end;
$$;

-- ---------------------------------------------------------------------------
-- pagar_fatura — settle part/all of a card invoice.
--
-- The card purchases were already recognised as expenses (OPERACIONAL), so the
-- payment movement is natureza 'LIQUIDACAO_FATURA' — never a second expense.
-- Atomically: creates the cash movement, updates the invoice paid/reserved
-- amounts and recomputes its status. A leftover reserve is carried, not zeroed.
-- ---------------------------------------------------------------------------

create or replace function public.pagar_fatura(
  p_estabelecimento_id uuid,
  p_fatura_id uuid,
  p_conta_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns void
language plpgsql
as $$
declare
  v_fatura public.faturas_cartao%rowtype;
  v_devido bigint;
  v_pendente bigint;
  v_novo_reservado bigint;
  v_novo_status public.fatura_status;
  v_saldo bigint;
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;

  select * into v_fatura
  from public.faturas_cartao
  where id = p_fatura_id and estabelecimento_id = p_estabelecimento_id and deleted_at is null
  for update;
  if not found then raise exception 'fatura nao encontrada'; end if;

  v_devido := coalesce(v_fatura.valor_fechado_centavos, 0);
  v_pendente := v_devido - v_fatura.valor_pago_centavos;
  if p_valor_centavos > v_pendente then
    raise exception 'pagamento excede o saldo pendente da fatura';
  end if;

  select saldo_atual_centavos into v_saldo
  from public.v_saldos_contas
  where id = p_conta_id and estabelecimento_id = p_estabelecimento_id
  for update;
  if v_saldo is null then raise exception 'conta nao encontrada'; end if;
  if v_saldo < p_valor_centavos then raise exception 'saldo insuficiente na conta'; end if;

  insert into public.movimentacoes_financeiras
    (estabelecimento_id, conta_id, tipo, natureza, valor_centavos, data_referencia, fatura_id, descricao)
  values
    (p_estabelecimento_id, p_conta_id, 'SAIDA', 'LIQUIDACAO_FATURA', p_valor_centavos, p_data_referencia, p_fatura_id, p_descricao);

  v_novo_reservado := greatest(v_fatura.valor_reservado_centavos - p_valor_centavos, 0);
  v_novo_status := case
    when v_fatura.valor_pago_centavos + p_valor_centavos >= v_devido then 'PAGA'
    else 'PARCIALMENTE_PAGA'
  end;

  update public.faturas_cartao
  set valor_pago_centavos = valor_pago_centavos + p_valor_centavos,
      valor_reservado_centavos = v_novo_reservado,
      status = v_novo_status
  where id = p_fatura_id;
end;
$$;
