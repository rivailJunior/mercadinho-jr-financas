-- Saídas do caixa passam a registrar de onde o dinheiro saiu:
--   'ENTRADA_DIA'      -> desconta da entrada/sobra do próprio dia
--   'SALDO_ACUMULADO'  -> desconta do saldo acumulado, sem afetar os
--                         totais operacionais do dia/mês
-- O saldo continua derivado das movimentacoes_financeiras (v_saldos_contas);
-- nenhuma tabela extra é necessária.

alter table public.lancamentos_caixa
  add column if not exists origem_saida varchar
    check (origem_saida is null or origem_saida in ('ENTRADA_DIA', 'SALDO_ACUMULADO'));

-- Saídas já registradas eram pagas com a entrada do próprio dia.
update public.lancamentos_caixa
   set origem_saida = 'ENTRADA_DIA'
 where tipo = 'SAIDA' and origem_saida is null;

-- Saídas pagas com o saldo acumulado não entram em saidas_registradas_dia.
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
  select coalesce(sum(c.valor_mensal), 0::numeric) as mensal
  from custos_fixos_config c
  where c.ativo and c.tipo_custo::text = 'VALOR_FIXO_MENSAL'::text
),
por_dia as (
  select
    l.data_referencia,
    coalesce(sum(case when l.tipo::text = 'ENTRADA'::text then l.valor else null::numeric end), 0::numeric) as entrou,
    coalesce(sum(case when l.tipo::text = 'SAIDA'::text
                            and l.origem_saida is distinct from 'SALDO_ACUMULADO'
                      then l.valor else null::numeric end), 0::numeric) as saiu
  from lancamentos_caixa l
  group by l.data_referencia
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
