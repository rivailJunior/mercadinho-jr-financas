-- Fatura do cartão vira um compromisso recorrente comum.
--
-- Motivation: the faturas_cartao/compras_cartao model was never fully wired —
-- nothing ever set valor_fechado_centavos (no close-invoice routine exists),
-- so pagar_fatura computed devido = 0 and rejected every payment. Card
-- purchases were also never registered in the app, so the "invoice" was
-- really just a monthly bill whose real amount the owner knows from the
-- bank — exactly what compromissos_financeiros already models (valor_previsto
-- + valor_efetivo, MENSAL recurrence, cycle roll, reserve earmark).
--
-- This migration:
--   1. Recreates desfazer_pagamento without the fatura branch (the column
--      movimentacoes_financeiras.fatura_id goes away).
--   2. Converts each non-paid open fatura into a "Fatura do cartão"
--      compromisso: previsto = linked reserve meta (fallback: Σ compras),
--      efetivo = the larger of the reserve balance and the Σ compras — i.e.
--      the best known proxy for this cycle's real bill.
--   3. Drops pagar_fatura, the fatura_id FK, both tables and the enum.

-- 1. desfazer_pagamento without fatura handling -----------------------------

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

-- 2. Fatura -> compromisso ---------------------------------------------------

insert into public.compromissos_financeiros
  (estabelecimento_id, nome, valor_previsto_centavos, valor_efetivo_centavos,
   periodicidade, vencimento, dia_vencimento, prioridade, reserva_id, status)
select
  f.estabelecimento_id,
  'Fatura do cartão',
  coalesce(
    r.meta_centavos,
    nullif(greatest(
      (select coalesce(sum(c.valor_centavos), 0)
         from public.compras_cartao c
        where c.fatura_id = f.id and c.deleted_at is null),
      coalesce(f.valor_fechado_centavos, 0)), 0),
    0),
  nullif(greatest(
    r.valor_atual_centavos,
    (select coalesce(sum(c.valor_centavos), 0)
       from public.compras_cartao c
      where c.fatura_id = f.id and c.deleted_at is null),
    coalesce(f.valor_fechado_centavos, 0)), 0),
  'MENSAL',
  f.vencimento,
  extract(day from f.vencimento)::smallint,
  0,
  f.reserva_id,
  'PENDENTE'
from public.faturas_cartao f
left join public.reservas_financeiras r
  on r.id = f.reserva_id and r.deleted_at is null
where f.deleted_at is null
  and f.status <> 'PAGA'
  and not exists (
    select 1 from public.compromissos_financeiros cc
    where cc.estabelecimento_id = f.estabelecimento_id
      and cc.nome = 'Fatura do cartão'
      and cc.deleted_at is null
  );

-- 3. Cleanup -----------------------------------------------------------------

drop function if exists public.pagar_fatura(uuid, uuid, uuid, bigint, date, varchar);

alter table public.movimentacoes_financeiras
  drop column if exists fatura_id;

drop table if exists public.compras_cartao;
drop table if exists public.faturas_cartao;
drop type if exists public.fatura_status;
