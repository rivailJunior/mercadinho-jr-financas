-- Consolidate lancamentos_caixa into movimentacoes_financeiras (phase 1).
--
-- Every legacy lancamento becomes a movement so the movements table is the
-- single ledger. The legacy table stays in place (read-only) until phase 2
-- drops it.
--
-- Balance rule: all backfilled rows pre-date data_saldo_inicial, so their
-- cash is already counted in saldo_inicial. They are inserted with
-- afeta_saldo = false and v_saldos_contas skips them — balances are
-- identical before and after the backfill. They DO appear in the daily
-- summary view (they are operational revenue/expense for reporting).

-- ---------------------------------------------------------------------------
-- Columns needed to carry the legacy record faithfully
-- ---------------------------------------------------------------------------

alter table public.movimentacoes_financeiras
  add column if not exists origem_saida varchar
    check (origem_saida is null or origem_saida in ('ENTRADA_DIA', 'SALDO_ACUMULADO')),
  add column if not exists forma_pagamento varchar,
  add column if not exists afeta_saldo boolean not null default true;

comment on column public.movimentacoes_financeiras.afeta_saldo is
  'false for backfilled legacy rows whose cash is already inside saldo_inicial';

-- Mirrored movements (created by the double-write) inherit the fields that
-- only exist on the legacy row, so nothing is lost when it goes away.
update public.movimentacoes_financeiras m
   set origem_saida = l.origem_saida,
       forma_pagamento = l.forma_pagamento,
       origem = l.origem
  from public.lancamentos_caixa l
 where m.lancamento_id = l.id;

-- Every lancamento without a mirrored movement becomes one. The account
-- attribution is unknowable for legacy rows (forma_pagamento is NULL/MISTO)
-- and irrelevant to balances; Caixa físico (the drawer) is the neutral pick.
insert into public.movimentacoes_financeiras
  (estabelecimento_id, conta_id, tipo, natureza, valor_centavos,
   data_referencia, categoria_id, descricao, origem, lancamento_id,
   origem_saida, forma_pagamento, afeta_saldo, created_at)
select
  l.estabelecimento_id,
  c.id,
  l.tipo::public.movimento_tipo,
  'OPERACIONAL',
  round(l.valor * 100)::bigint,
  l.data_referencia,
  l.categoria_id,
  l.descricao,
  l.origem,
  l.id,
  l.origem_saida,
  l.forma_pagamento,
  false,
  l.created_at
from public.lancamentos_caixa l
join public.contas_financeiras c
  on c.estabelecimento_id = l.estabelecimento_id
 and c.tipo = 'CAIXA_FISICO'
 and c.deleted_at is null
where not exists (
  select 1 from public.movimentacoes_financeiras m
  where m.lancamento_id = l.id
);

-- ---------------------------------------------------------------------------
-- Balances: skip backfilled history (already inside saldo_inicial)
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
  on m.conta_id = c.id and m.deleted_at is null and m.afeta_saldo
where c.deleted_at is null
group by c.id;

alter view public.v_saldos_contas set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- Daily summary: same output columns, now sourced from movements.
-- natureza = 'OPERACIONAL' excludes transfer legs and obligation
-- liquidations — neither is day revenue/expense. afeta_saldo is NOT
-- filtered here: backfilled history is real operational data.
-- ---------------------------------------------------------------------------

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
