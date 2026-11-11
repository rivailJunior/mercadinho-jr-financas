-- Undo support for the new history tabs (transferências + pagamentos).
--
-- Like desfazer_aporte_reserva, these reverse an operation completely instead
-- of soft-deleting it: the row leaves the audit trail and every side effect
-- is rolled back, so derived balances and obligations stay consistent.
--
-- desfazer_transferencia — pure transfers only. A transfer created by
-- pagar_compromisso (internal settlement, legs carry compromisso_id) must be
-- undone via desfazer_pagamento, which also reopens the commitment.
--
-- desfazer_pagamento — reverses a LIQUIDACAO_* payment (or an internal
-- settlement transfer):
--   1. restores the reserve earmark. The RETIRADA row written by
--      pagar_fatura/pagar_compromisso shares the payment's created_at —
--      now() is stable inside a transaction — so it is matched exactly.
--   2. reopens the obligation: valor_pago/status on the fatura or
--      compromisso, including the rolled MENSAL cycle (vencimento goes back
--      to the previous month's due day, same clamp as proximo_vencimento).
--   3. removes the cash movement — both legs for internal settlements.

create or replace function public.desfazer_transferencia(
  p_transferencia_id uuid
)
returns void
language plpgsql
as $$
declare
  v_t public.transferencias%rowtype;
begin
  select * into v_t
  from public.transferencias
  where id = p_transferencia_id and deleted_at is null
  for update;
  if not found then raise exception 'transferencia nao encontrada'; end if;

  if exists (
    select 1 from public.movimentacoes_financeiras
    where transferencia_id = p_transferencia_id
      and deleted_at is null
      and (compromisso_id is not null or fatura_id is not null)
  ) then
    raise exception 'transferencia vinculada a um pagamento — desfaca pela aba Pagamentos';
  end if;

  delete from public.movimentacoes_financeiras where transferencia_id = p_transferencia_id;
  delete from public.transferencias where id = p_transferencia_id;
end;
$$;

create or replace function public.desfazer_pagamento(
  p_movimentacao_id uuid
)
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
     or v_mov.natureza not in ('LIQUIDACAO_FATURA', 'LIQUIDACAO_COMPROMISSO', 'TRANSFERENCIA')
     or (v_mov.natureza = 'TRANSFERENCIA' and v_mov.compromisso_id is null) then
    raise exception 'este lancamento nao e um pagamento';
  end if;

  -- 1. Restore the reserve earmark released by this payment.
  delete from public.movimentacoes_reservas
  where estabelecimento_id = v_mov.estabelecimento_id
    and tipo = 'RETIRADA'
    and created_at = v_mov.created_at
  returning * into v_retirada;
  if found then
    update public.reservas_financeiras
    set valor_atual_centavos = valor_atual_centavos + v_retirada.valor_centavos
    where id = v_retirada.reserva_id;
  end if;

  -- 2. Reopen the obligation.
  if v_mov.fatura_id is not null then
    update public.faturas_cartao
    set valor_pago_centavos = greatest(valor_pago_centavos - v_mov.valor_centavos, 0),
        valor_reservado_centavos = least(
          valor_reservado_centavos + v_mov.valor_centavos,
          coalesce(valor_fechado_centavos, 0)),
        status = case
          when greatest(valor_pago_centavos - v_mov.valor_centavos, 0) <= 0
            then 'FECHADA'::public.fatura_status
          else 'PARCIALMENTE_PAGA'::public.fatura_status
        end
    where id = v_mov.fatura_id;
  end if;

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

revoke execute on function public.desfazer_transferencia(uuid) from anon;
revoke execute on function public.desfazer_pagamento(uuid) from anon;
