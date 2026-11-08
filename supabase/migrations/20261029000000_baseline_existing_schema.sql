-- Baseline: existing schema as of 2026-10-29 (reconstructed, idempotent).
--
-- The original 9 migrations were applied directly on the remote project and
-- were NOT versioned in the repo. This file captures the pre-refactor schema so
-- a fresh environment can be rebuilt. It is written with IF NOT EXISTS / CREATE
-- OR REPLACE guards so it is safe to run against the existing remote database.
--
-- Monetary columns here keep their legacy numeric(10,2) type on purpose — the
-- v2 refactor introduces integer-cents columns in NEW tables without rewriting
-- this historical data. See 20261108_*_financial_management_v2.sql.

create table if not exists public.estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome varchar not null default 'Mercado Amigo',
  dias_uteis_mes_padrao integer default 26,
  created_at timestamptz default now()
);

create table if not exists public.categorias (
  id serial primary key,
  tipo varchar not null check (tipo in ('ENTRADA', 'SAIDA')),
  nome varchar not null,
  descricao text,
  ativo boolean default true
);

create table if not exists public.lancamentos_caixa (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references public.estabelecimentos (id),
  data_referencia date not null,
  tipo varchar not null check (tipo in ('ENTRADA', 'SAIDA')),
  valor numeric(10, 2) not null check (valor > 0),
  categoria_id integer references public.categorias (id),
  descricao varchar,
  forma_pagamento varchar,
  origem varchar default 'APP_MOBILE',
  sincronizado_sheets boolean default false,
  sheets_row_id varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_lancamentos_data_ref
  on public.lancamentos_caixa using btree (data_referencia);

create table if not exists public.custos_fixos_config (
  id serial primary key,
  estabelecimento_id uuid references public.estabelecimentos (id),
  nome varchar not null,
  tipo_custo varchar not null check (tipo_custo in ('VALOR_FIXO_MENSAL', 'PERCENTUAL_RECEITA')),
  valor_mensal numeric(10, 2) default 0.00,
  percentual_sugerido numeric(5, 2) default 0.00,
  ativo boolean default true,
  mes_ano_vigencia date not null
);

create table if not exists public.config_financeira (
  id serial primary key,
  estabelecimento_id uuid references public.estabelecimentos (id),
  margem_bruta_pct numeric(5, 2) not null default 20.00,
  split_reserva_pct numeric(5, 2) not null default 50.00,
  split_reinvestimento_pct numeric(5, 2) not null default 30.00,
  split_contingencia_pct numeric(5, 2) not null default 20.00,
  created_at timestamptz default now()
);

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
    coalesce(sum(case when l.tipo::text = 'SAIDA'::text then l.valor else null::numeric end), 0::numeric) as saiu
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
