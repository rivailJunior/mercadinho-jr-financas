-- Recurring monthly commitments: per-item due day + cycle roll on payment.
--
-- Each MENSAL compromisso is a recurring template. `vencimento` always holds
-- the CURRENT open cycle's due date; when a payment covers the full amount
-- the row rolls to the next cycle (pendente again, next month's due date),
-- so money provisioned from now on funds the future bill — never a settled
-- one. `dia_vencimento` (1-31, NULL = last day) drives the cycle dates.

alter table public.compromissos_financeiros
  add column if not exists dia_vencimento smallint
    check (dia_vencimento between 1 and 31);

-- Next cycle's due date: the due day in the month after p_base's month,
-- clamped to that month's last day (handles Feb for day 29-31).
create or replace function public.proximo_vencimento(p_base date, p_dia smallint)
returns date
language sql
immutable
as $$
  select least(
    (date_trunc('month', p_base) + interval '1 month'
      + make_interval(days => coalesce(p_dia, 31) - 1))::date,
    (date_trunc('month', p_base) + interval '2 months' - interval '1 day')::date
  );
$$;

-- Due day per commitment: água/energia on the 6th; everything else month-end.
update public.compromissos_financeiros
set dia_vencimento = 6
where nome ~* '(á|a)gua|energia|luz'
  and dia_vencimento is null;

-- Commitments still missing a due date get this month's one — which may
-- already be past. An overdue bill must read as overdue, not silently roll
-- forward to next month.
update public.compromissos_financeiros c
set vencimento = least(
  (date_trunc('month', current_date)
    + make_interval(days => coalesce(c.dia_vencimento, 31) - 1))::date,
  (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date)
where c.vencimento is null and c.status <> 'PAGO';

-- Bills already settled this cycle open the next one immediately.
update public.compromissos_financeiros c
set vencimento = public.proximo_vencimento(
      coalesce(c.vencimento, current_date), c.dia_vencimento),
    valor_pago_centavos = 0,
    valor_efetivo_centavos = null,
    status = 'PENDENTE'
where c.status = 'PAGO' and c.periodicidade = 'MENSAL';

-- pagar_compromisso: on full payment a MENSAL compromisso rolls to the next
-- cycle instead of staying PAGO forever. One-off commitments keep the
-- PAGO/PARCIALMENTE_PAGO statuses as before.
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
