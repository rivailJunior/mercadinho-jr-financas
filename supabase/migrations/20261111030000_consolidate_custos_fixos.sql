-- Consolidate custos_fixos_config into compromissos_financeiros.
--
-- The legacy config table fed exactly one consumer: the `fixo` CTE inside
-- view_resumo_diario (monthly fixed cost ÷ business days). The v2
-- compromissos already track the same bills with more detail (due day,
-- reserve link, paid amount, recurring cycle), so the daily fixed cost is
-- now derived from them — single source of truth.
--
-- Semantic note: every active MENSAL compromisso counts, including
-- "Reserva financeira" (the monthly savings provision) — it replaces the
-- legacy PERCENTUAL_RECEITA row that the view always ignored. The total
-- moves from R$ 5.100 (stale config, vigencia 2024-10) to R$ 6.400 (the
-- bills actually being paid).
--
-- Also drops pagamentos_compromissos: an audit table that was created in
-- v2 but never written or read — payment history is auditable via
-- movimentacoes_financeiras.compromisso_id.

create or replace view public.view_resumo_diario as
with cfg as (
  select
    cf.margem_bruta_pct,
    cf.split_reserva_pct,
    cf.split_reinvestimento_pct,
    cf.split_contingencia_pct,
    coalesce(e.dias_uteis_mes_padrao, 30) as dias
  from config_financeira cf
  join estabelecimentos e on e.id = cf.estabelecimento_id
  order by cf.id
  limit 1
),
fixo as (
  select coalesce(
    sum(coalesce(c.valor_efetivo_centavos, c.valor_previsto_centavos)),
    0)::numeric / 100.0 as mensal
  from compromissos_financeiros c
  where c.ativo
    and c.deleted_at is null
    and c.periodicidade = 'MENSAL'::public.compromisso_periodicidade
),
por_dia as (
  select
    m.data_referencia,
    coalesce(sum(case when m.tipo = 'ENTRADA'::public.movimento_tipo
                      then m.valor_centavos else null end), 0) / 100.0 as entrou,
    coalesce(sum(case when m.tipo = 'SAIDA'::public.movimento_tipo
                          and m.origem_saida is distinct from 'SALDO_ACUMULADO'
                      then m.valor_centavos else null end), 0) / 100.0 as saiu
  from movimentacoes_financeiras m
  where m.natureza = 'OPERACIONAL'::public.movimento_natureza
    and m.deleted_at is null
  group by m.data_referencia
),
calc as (
  select
    d.data_referencia,
    d.entrou as faturamento_dia,
    round(d.entrou * cfg.margem_bruta_pct / 100.0, 2) as lucro_bruto_dia,
    round(d.entrou * (100.0 - cfg.margem_bruta_pct) / 100.0, 2) as custo_mercadoria_dia,
    round(fixo.mensal / cfg.dias::numeric, 2) as custos_fixos_dia,
    d.saiu as saidas_registradas_dia,
    round(d.entrou * cfg.margem_bruta_pct / 100.0 - fixo.mensal / cfg.dias::numeric, 2) as lucro_liquido_dia,
    cfg.split_reserva_pct,
    cfg.split_reinvestimento_pct,
    cfg.split_contingencia_pct
  from por_dia d
  cross join cfg
  cross join fixo
)
select
  data_referencia,
  faturamento_dia,
  lucro_bruto_dia,
  custo_mercadoria_dia,
  custos_fixos_dia,
  saidas_registradas_dia,
  lucro_liquido_dia,
  round(lucro_liquido_dia * split_reserva_pct / 100.0, 2) as reserva_dia,
  round(lucro_liquido_dia * split_reinvestimento_pct / 100.0, 2) as reinvestimento_dia,
  round(lucro_liquido_dia * split_contingencia_pct / 100.0, 2) as contingencia_dia
from calc
order by data_referencia;

alter view public.view_resumo_diario set (security_invoker = on);

drop table public.custos_fixos_config;
drop table public.pagamentos_compromissos;
