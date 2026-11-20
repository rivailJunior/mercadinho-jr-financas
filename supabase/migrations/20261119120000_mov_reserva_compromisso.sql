-- movimentacoes_reservas.compromisso_id — links a reserve withdrawal to the
-- commitment it settled.
--
-- pagar_compromisso already records the payment on movimentacoes_financeiras
-- (the cash leg), but the RETIRADA it writes to movimentacoes_reservas carried
-- no reference to the obligation. Linking it gives the reserve audit trail the
-- full history — which bill consumed the earmark and when — including MENSAL
-- commitments whose cycle rolls forward and resets valor_pago to zero.

alter table public.movimentacoes_reservas
  add column if not exists compromisso_id uuid references public.compromissos_financeiros (id);

create index if not exists idx_mov_reserva_compromisso
  on public.movimentacoes_reservas (compromisso_id);

-- Backfill: the payment cash leg and its reserve withdrawal share the same
-- created_at (now() is stable inside a transaction), so past RETIRADA rows
-- can be linked to the compromisso their payment settled.
update public.movimentacoes_reservas mr
set compromisso_id = mf.compromisso_id
from public.movimentacoes_financeiras mf
where mr.tipo = 'RETIRADA'
  and mr.compromisso_id is null
  and mf.estabelecimento_id = mr.estabelecimento_id
  and mf.created_at = mr.created_at
  and mf.tipo = 'SAIDA'
  and mf.compromisso_id is not null
  and mf.natureza in ('LIQUIDACAO_COMPROMISSO', 'TRANSFERENCIA');

-- pagar_compromisso: same settlement flow as before, now also recording the
-- compromisso on the RETIRADA it writes to movimentacoes_reservas.
create or replace function public.pagar_compromisso(
  p_estabelecimento_id uuid,
  p_compromisso_id uuid,
  p_conta_id uuid,
  p_valor_centavos bigint,
  p_data_referencia date default current_date,
  p_descricao varchar default null
)
returns void
language plpgsql
as $$
declare
  v_compromisso public.compromissos_financeiros%rowtype;
  v_devido bigint;
  v_pendente bigint;
  v_saldo bigint;
  v_consumo_reserva bigint;
  v_transferencia_id uuid;
  v_quitado boolean;
begin
  if p_valor_centavos is null or p_valor_centavos <= 0 then
    raise exception 'valor_centavos deve ser positivo';
  end if;

  select * into v_compromisso
  from public.compromissos_financeiros
  where id = p_compromisso_id and estabelecimento_id = p_estabelecimento_id and deleted_at is null
  for update;
  if not found then raise exception 'compromisso nao encontrado'; end if;
  if v_compromisso.status = 'PAGO' then raise exception 'compromisso ja esta pago'; end if;

  v_devido := coalesce(v_compromisso.valor_efetivo_centavos, v_compromisso.valor_previsto_centavos);
  v_pendente := v_devido - v_compromisso.valor_pago_centavos;
  if v_pendente <= 0 then raise exception 'compromisso sem saldo pendente'; end if;
  if p_valor_centavos > v_pendente then
    raise exception 'pagamento excede o saldo pendente do compromisso';
  end if;

  perform 1 from public.contas_financeiras
  where id = p_conta_id and estabelecimento_id = p_estabelecimento_id
  for update;
  if not found then raise exception 'conta nao encontrada'; end if;

  select saldo_atual_centavos into v_saldo
  from public.v_saldos_contas
  where id = p_conta_id;
  if v_saldo < p_valor_centavos then raise exception 'saldo insuficiente na conta'; end if;

  if v_compromisso.destino_conta_id is not null then
    -- Internal settlement: money moves to another account of the business.
    if v_compromisso.destino_conta_id = p_conta_id then
      raise exception 'conta de origem e destino devem ser diferentes';
    end if;
    insert into public.transferencias
      (estabelecimento_id, conta_origem_id, conta_destino_id, valor_centavos, data_referencia, descricao)
    values
      (p_estabelecimento_id, p_conta_id, v_compromisso.destino_conta_id, p_valor_centavos, p_data_referencia,
       coalesce(p_descricao, v_compromisso.nome))
    returning id into v_transferencia_id;

    insert into public.movimentacoes_financeiras
      (estabelecimento_id, conta_id, tipo, natureza, valor_centavos, data_referencia,
       transferencia_id, compromisso_id, descricao)
    values
      (p_estabelecimento_id, p_conta_id, 'SAIDA', 'TRANSFERENCIA', p_valor_centavos,
       p_data_referencia, v_transferencia_id, p_compromisso_id,
       coalesce(p_descricao, v_compromisso.nome)),
      (p_estabelecimento_id, v_compromisso.destino_conta_id, 'ENTRADA', 'TRANSFERENCIA',
       p_valor_centavos, p_data_referencia, v_transferencia_id, p_compromisso_id,
       coalesce(p_descricao, v_compromisso.nome));
  else
    -- External settlement: money leaves the business as a liquidation,
    -- never as a new operational expense.
    insert into public.movimentacoes_financeiras
      (estabelecimento_id, conta_id, tipo, natureza, valor_centavos, data_referencia,
       compromisso_id, descricao)
    values
      (p_estabelecimento_id, p_conta_id, 'SAIDA', 'LIQUIDACAO_COMPROMISSO', p_valor_centavos,
       p_data_referencia, p_compromisso_id, coalesce(p_descricao, v_compromisso.nome));
  end if;

  -- Release the linked reserve's earmark up to the paid amount, recording
  -- which commitment consumed it.
  if v_compromisso.reserva_id is not null then
    select least(p_valor_centavos, valor_atual_centavos) into v_consumo_reserva
    from public.reservas_financeiras
    where id = v_compromisso.reserva_id
      and estabelecimento_id = p_estabelecimento_id
      and deleted_at is null
    for update;

    if v_consumo_reserva is not null and v_consumo_reserva > 0 then
      update public.reservas_financeiras
      set valor_atual_centavos = valor_atual_centavos - v_consumo_reserva
      where id = v_compromisso.reserva_id;

      insert into public.movimentacoes_reservas
        (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia,
         compromisso_id, descricao)
      values
        (p_estabelecimento_id, v_compromisso.reserva_id, 'RETIRADA', v_consumo_reserva,
         p_data_referencia, p_compromisso_id, coalesce(p_descricao, v_compromisso.nome));
    end if;
  end if;

  v_quitado := v_compromisso.valor_pago_centavos + p_valor_centavos >= v_devido;
  if v_quitado and v_compromisso.periodicidade = 'MENSAL' then
    -- Cycle closed: open the next monthly bill right away.
    update public.compromissos_financeiros
    set valor_pago_centavos = 0,
        valor_efetivo_centavos = null,
        status = 'PENDENTE',
        vencimento = public.proximo_vencimento(
          coalesce(v_compromisso.vencimento, p_data_referencia),
          v_compromisso.dia_vencimento)
    where id = p_compromisso_id;
  else
    update public.compromissos_financeiros
    set valor_pago_centavos = valor_pago_centavos + p_valor_centavos,
        status = case
          when v_quitado then 'PAGO'::public.compromisso_status
          else 'PARCIALMENTE_PAGO'::public.compromisso_status
        end
    where id = p_compromisso_id;
  end if;
end;
$$;

revoke execute on function public.pagar_compromisso(uuid, uuid, uuid, bigint, date, varchar) from anon;

-- desfazer_pagamento: the reserve withdrawal is now matched preferentially by
-- the compromisso link; legacy rows (NULL compromisso_id) still match by
-- created_at so payments made before this migration can be undone.
create or replace function public.desfazer_pagamento(p_movimentacao_id uuid)
returns void
language plpgsql
as $$
declare
  v_mov public.movimentacoes_financeiras%rowtype;
  v_retirada public.movimentacoes_reservas%rowtype;
  v_comp public.compromissos_financeiros%rowtype;
  v_novo_pago bigint;
begin
  select * into v_mov
  from public.movimentacoes_financeiras
  where id = p_movimentacao_id and deleted_at is null
  for update;
  if not found then raise exception 'pagamento nao encontrado'; end if;
  if v_mov.tipo <> 'SAIDA'
     or v_mov.natureza not in ('LIQUIDACAO_COMPROMISSO', 'TRANSFERENCIA')
     or (v_mov.natureza = 'TRANSFERENCIA' and v_mov.compromisso_id is null) then
    raise exception 'este lancamento nao e um pagamento';
  end if;

  -- 1. Restore the reserve earmark released by this payment.
  delete from public.movimentacoes_reservas
  where estabelecimento_id = v_mov.estabelecimento_id
    and tipo = 'RETIRADA'
    and created_at = v_mov.created_at
    and (compromisso_id = v_mov.compromisso_id or compromisso_id is null)
  returning * into v_retirada;
  if found then
    update public.reservas_financeiras
    set valor_atual_centavos = valor_atual_centavos + v_retirada.valor_centavos
    where id = v_retirada.reserva_id;
  end if;

  -- 2. Reopen the obligation.
  if v_mov.compromisso_id is not null then
    select * into v_comp
    from public.compromissos_financeiros
    where id = v_mov.compromisso_id
    for update;

    if found then
      if v_comp.valor_pago_centavos = 0
         and v_comp.status = 'PENDENTE'
         and v_comp.periodicidade = 'MENSAL' then
        -- This payment settled a cycle that already rolled forward: reopen
        -- the previous cycle (due day of the month before vencimento).
        v_novo_pago := greatest(
          coalesce(v_comp.valor_efetivo_centavos, v_comp.valor_previsto_centavos)
            - v_mov.valor_centavos, 0);
        update public.compromissos_financeiros
        set valor_pago_centavos = v_novo_pago,
            status = case
              when v_novo_pago <= 0 then 'PENDENTE'::public.compromisso_status
              else 'PARCIALMENTE_PAGO'::public.compromisso_status
            end,
            vencimento = case
              when v_comp.vencimento is null then null
              else least(
                (date_trunc('month', v_comp.vencimento) - interval '1 month'
                  + make_interval(days => coalesce(v_comp.dia_vencimento, 31) - 1))::date,
                (date_trunc('month', v_comp.vencimento) - interval '1 day')::date)
            end
        where id = v_comp.id;
      else
        v_novo_pago := greatest(v_comp.valor_pago_centavos - v_mov.valor_centavos, 0);
        update public.compromissos_financeiros
        set valor_pago_centavos = v_novo_pago,
            status = case
              when v_novo_pago <= 0 then 'PENDENTE'::public.compromisso_status
              else 'PARCIALMENTE_PAGO'::public.compromisso_status
            end
        where id = v_comp.id;
      end if;
    end if;
  end if;

  -- 3. Remove the cash effect — both legs for internal settlements.
  if v_mov.transferencia_id is not null then
    delete from public.movimentacoes_financeiras
    where transferencia_id = v_mov.transferencia_id;
    delete from public.transferencias where id = v_mov.transferencia_id;
  else
    delete from public.movimentacoes_financeiras where id = v_mov.id;
  end if;
end;
$$;

revoke execute on function public.desfazer_pagamento(uuid) from anon;
