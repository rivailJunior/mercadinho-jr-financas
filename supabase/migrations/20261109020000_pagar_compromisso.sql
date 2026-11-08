-- Commitment settlement ("pagar conta fixa").
--
-- Two settlement modes driven by compromissos_financeiros.destino_conta_id:
--   - destino_conta_id IS NULL  -> money leaves the business (pro-labore,
--     funcionario, agua, energia): a SAIDA movement of nature
--     LIQUIDACAO_COMPROMISSO, so it is never double-counted as an expense.
--   - destino_conta_id IS SET   -> the obligation is settled by an internal
--     transfer (reserva financeira -> conta do comercio): a transferencia
--     row with a TRANSFERENCIA movement pair; consolidated stays unchanged.
--
-- In both modes the linked reserve (reserva_id) is released up to the paid
-- amount — same rule as pagar_fatura — and valor_pago/status are tracked so
-- partial payments are supported.

alter type public.compromisso_status add value if not exists 'PARCIALMENTE_PAGO';

alter table public.compromissos_financeiros
  add column if not exists valor_pago_centavos bigint not null default 0
    check (valor_pago_centavos >= 0),
  add column if not exists destino_conta_id uuid references public.contas_financeiras (id);

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

  -- Release the linked reserve's earmark up to the paid amount.
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
        (estabelecimento_id, reserva_id, tipo, valor_centavos, data_referencia, descricao)
      values
        (p_estabelecimento_id, v_compromisso.reserva_id, 'RETIRADA', v_consumo_reserva,
         p_data_referencia, coalesce(p_descricao, v_compromisso.nome));
    end if;
  end if;

  update public.compromissos_financeiros
  set valor_pago_centavos = valor_pago_centavos + p_valor_centavos,
      status = case
        when v_compromisso.valor_pago_centavos + p_valor_centavos >= v_devido then 'PAGO'::public.compromisso_status
        else 'PARCIALMENTE_PAGO'::public.compromisso_status
      end
  where id = p_compromisso_id;
end;
$$;

revoke execute on function public.pagar_compromisso(uuid, uuid, uuid, bigint, date, varchar) from anon;
