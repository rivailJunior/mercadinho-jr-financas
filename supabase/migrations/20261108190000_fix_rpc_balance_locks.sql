-- Fix: FOR UPDATE cannot be applied to the GROUP BY view v_saldos_contas.
-- Lock the underlying contas_financeiras row (serializes concurrent writes on
-- the same account) and read the derived balance from the view separately.

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

  perform 1 from public.contas_financeiras
  where id = p_conta_origem_id and estabelecimento_id = p_estabelecimento_id
  for update;
  if not found then raise exception 'conta de origem nao encontrada'; end if;

  select saldo_atual_centavos into v_saldo_origem
  from public.v_saldos_contas
  where id = p_conta_origem_id;
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

  perform 1 from public.contas_financeiras
  where id = p_conta_id and estabelecimento_id = p_estabelecimento_id
  for update;
  if not found then raise exception 'conta nao encontrada'; end if;

  select saldo_atual_centavos into v_saldo
  from public.v_saldos_contas
  where id = p_conta_id;
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
