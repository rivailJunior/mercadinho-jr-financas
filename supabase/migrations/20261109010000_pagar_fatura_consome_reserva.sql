-- pagar_fatura consumed the account balance and the invoice's own
-- valor_reservado, but never touched the linked reserva_financeira.
-- Result: after paying the invoice the card reserve still showed money
-- earmarked for a bill already paid, and saldo livre went negative.
-- Now the payment also releases the earmark (up to what the reserve
-- holds) and logs a RETIRADA for the reserve audit trail.
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
  v_consumo_reserva bigint;
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

  -- Consume the linked reserve's earmark: the paid money leaves the
  -- consolidated balance, so the matching logical earmark must be
  -- released too — otherwise totalReservado would keep claiming money
  -- that is already gone.
  if v_fatura.reserva_id is not null then
    select least(p_valor_centavos, valor_atual_centavos) into v_consumo_reserva
    from public.reservas_financeiras
    where id = v_fatura.reserva_id
      and estabelecimento_id = p_estabelecimento_id
      and deleted_at is null
    for update;

    if v_consumo_reserva is not null and v_consumo_reserva > 0 then
      update public.reservas_financeiras
      set valor_atual_centavos = valor_atual_centavos - v_consumo_reserva
      where id = v_fatura.reserva_id;

      insert into public.movimentacoes_reservas
        (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia, descricao)
      values
        (p_estabelecimento_id, v_fatura.reserva_id, 'RETIRADA', v_consumo_reserva, p_data_referencia,
         coalesce(p_descricao, 'Pagamento de fatura'));
    end if;
  end if;
end;
$$;
