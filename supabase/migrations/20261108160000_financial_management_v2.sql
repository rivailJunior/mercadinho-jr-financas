-- Financial management v2 — additive schema (no destructive changes).
--
-- Introduces the full financial model described in the refactor plan:
-- financial accounts, real cash movements, internal transfers, logical
-- reserves (envelopes), commitments, commitment payments, credit-card invoice
-- cycles and card purchases.
--
-- Design rules:
--   * All monetary values are stored as INTEGER CENTS (bigint), never numeric
--     reais — exact integer arithmetic, no floating point.
--   * Every row is isolated by estabelecimento_id.
--   * created_at / updated_at auditing + soft delete (deleted_at) where useful.
--   * Enums instead of free-text status/type strings.
--   * RLS is ENABLED on every new table (secure by default). Access policies
--     are added together with Supabase Auth in a later migration; until then
--     these tables are reachable only via the service role on the server.
--   * The legacy tables (lancamentos_caixa etc.) are left completely untouched.

-- ---------------------------------------------------------------------------
-- Shared helpers & enums
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create type public.conta_tipo as enum ('CAIXA_FISICO', 'MAQUININHA', 'BANCO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.movimento_tipo as enum ('ENTRADA', 'SAIDA');
exception when duplicate_object then null; end $$;

-- Recognition model: separates operational P&L from pure cash settlement so the
-- same money is never double counted (e.g. a card purchase is OPERACIONAL, but
-- paying its invoice is LIQUIDACAO_FATURA — not a second expense).
do $$ begin
  create type public.movimento_natureza as enum (
    'OPERACIONAL',
    'TRANSFERENCIA',
    'LIQUIDACAO_FATURA',
    'LIQUIDACAO_COMPROMISSO',
    'SALDO_INICIAL'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compromisso_periodicidade as enum ('UNICO', 'SEMANAL', 'MENSAL', 'ANUAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compromisso_status as enum (
    'PENDENTE', 'PARCIALMENTE_RESERVADO', 'RESERVADO', 'PAGO', 'VENCIDO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.fatura_status as enum (
    'ABERTA', 'FECHADA', 'PARCIALMENTE_PAGA', 'PAGA', 'VENCIDA'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reserva_mov_tipo as enum (
    'APORTE', 'RETIRADA', 'TRANSFERENCIA_ENTRADA', 'TRANSFERENCIA_SAIDA'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Contas financeiras (where the money physically is)
-- ---------------------------------------------------------------------------

create table if not exists public.contas_financeiras (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  nome varchar not null,
  tipo public.conta_tipo not null,
  saldo_inicial_centavos bigint not null default 0,
  data_saldo_inicial date not null default current_date,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_contas_estab on public.contas_financeiras (estabelecimento_id);
create trigger trg_contas_updated_at before update on public.contas_financeiras
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reservas financeiras (logical envelopes / destination of money)
-- ---------------------------------------------------------------------------

create table if not exists public.reservas_financeiras (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  nome varchar not null,
  finalidade text,
  valor_atual_centavos bigint not null default 0 check (valor_atual_centavos >= 0),
  meta_centavos bigint check (meta_centavos is null or meta_centavos >= 0),
  prioridade integer not null default 100,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_reservas_estab on public.reservas_financeiras (estabelecimento_id);
create trigger trg_reservas_updated_at before update on public.reservas_financeiras
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Compromissos financeiros (commitments / contas a pagar)
-- ---------------------------------------------------------------------------

create table if not exists public.compromissos_financeiros (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  nome varchar not null,
  categoria_id integer references public.categorias (id),
  valor_previsto_centavos bigint not null default 0 check (valor_previsto_centavos >= 0),
  valor_efetivo_centavos bigint check (valor_efetivo_centavos is null or valor_efetivo_centavos >= 0),
  periodicidade public.compromisso_periodicidade not null default 'MENSAL',
  vencimento date,
  prioridade integer not null default 100,
  reserva_id uuid references public.reservas_financeiras (id),
  status public.compromisso_status not null default 'PENDENTE',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_compromissos_estab on public.compromissos_financeiros (estabelecimento_id);
create index if not exists idx_compromissos_venc on public.compromissos_financeiros (vencimento);
create index if not exists idx_compromissos_status on public.compromissos_financeiros (status);
create trigger trg_compromissos_updated_at before update on public.compromissos_financeiros
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Faturas de cartão (invoice cycles) + card purchases
-- ---------------------------------------------------------------------------

create table if not exists public.faturas_cartao (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  reserva_id uuid references public.reservas_financeiras (id),
  fechamento date not null,
  vencimento date not null,
  valor_fechado_centavos bigint check (valor_fechado_centavos is null or valor_fechado_centavos >= 0),
  valor_reservado_centavos bigint not null default 0 check (valor_reservado_centavos >= 0),
  valor_pago_centavos bigint not null default 0 check (valor_pago_centavos >= 0),
  status public.fatura_status not null default 'ABERTA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_faturas_estab on public.faturas_cartao (estabelecimento_id);
create index if not exists idx_faturas_venc on public.faturas_cartao (vencimento);
create trigger trg_faturas_updated_at before update on public.faturas_cartao
  for each row execute function public.set_updated_at();

create table if not exists public.compras_cartao (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  fatura_id uuid references public.faturas_cartao (id),
  categoria_id integer references public.categorias (id),
  data_compra date not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  descricao varchar,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_compras_estab on public.compras_cartao (estabelecimento_id);
create index if not exists idx_compras_fatura on public.compras_cartao (fatura_id);
create trigger trg_compras_updated_at before update on public.compras_cartao
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Transferências internas (do not change the consolidated balance)
-- ---------------------------------------------------------------------------

create table if not exists public.transferencias (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  conta_origem_id uuid not null references public.contas_financeiras (id),
  conta_destino_id uuid not null references public.contas_financeiras (id),
  valor_centavos bigint not null check (valor_centavos > 0),
  data_referencia date not null default current_date,
  descricao varchar,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint transferencia_contas_distintas check (conta_origem_id <> conta_destino_id)
);
create index if not exists idx_transferencias_estab on public.transferencias (estabelecimento_id);

-- ---------------------------------------------------------------------------
-- Movimentações financeiras (real cash movements — single source of truth)
-- ---------------------------------------------------------------------------

create table if not exists public.movimentacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  conta_id uuid not null references public.contas_financeiras (id),
  tipo public.movimento_tipo not null,
  natureza public.movimento_natureza not null default 'OPERACIONAL',
  valor_centavos bigint not null check (valor_centavos > 0),
  data_referencia date not null default current_date,
  categoria_id integer references public.categorias (id),
  descricao varchar,
  -- Optional links establishing what a movement settles (avoids double counting).
  compromisso_id uuid references public.compromissos_financeiros (id),
  fatura_id uuid references public.faturas_cartao (id),
  transferencia_id uuid references public.transferencias (id),
  origem varchar not null default 'APP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_mov_estab on public.movimentacoes_financeiras (estabelecimento_id);
create index if not exists idx_mov_conta on public.movimentacoes_financeiras (conta_id);
create index if not exists idx_mov_data on public.movimentacoes_financeiras (data_referencia);
create index if not exists idx_mov_natureza on public.movimentacoes_financeiras (natureza);
create trigger trg_mov_updated_at before update on public.movimentacoes_financeiras
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Histórico de reservas e pagamentos de compromissos (auditável)
-- ---------------------------------------------------------------------------

create table if not exists public.movimentacoes_reservas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  reserva_id uuid not null references public.reservas_financeiras (id),
  tipo public.reserva_mov_tipo not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  data_referencia date not null default current_date,
  -- For transfers between reserves, links the two legs together.
  contraparte_reserva_id uuid references public.reservas_financeiras (id),
  descricao varchar,
  created_at timestamptz not null default now()
);
create index if not exists idx_mov_reserva_estab on public.movimentacoes_reservas (estabelecimento_id);
create index if not exists idx_mov_reserva_reserva on public.movimentacoes_reservas (reserva_id);

create table if not exists public.pagamentos_compromissos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid not null references public.estabelecimentos (id),
  compromisso_id uuid not null references public.compromissos_financeiros (id),
  movimentacao_id uuid references public.movimentacoes_financeiras (id),
  valor_centavos bigint not null check (valor_centavos > 0),
  data_pagamento date not null default current_date,
  descricao varchar,
  created_at timestamptz not null default now()
);
create index if not exists idx_pag_compromisso_estab on public.pagamentos_compromissos (estabelecimento_id);
create index if not exists idx_pag_compromisso_comp on public.pagamentos_compromissos (compromisso_id);

-- ---------------------------------------------------------------------------
-- Config: minimum operating cash + configurable allocation priority
-- ---------------------------------------------------------------------------

alter table public.config_financeira
  add column if not exists caixa_minimo_centavos bigint not null default 0;
alter table public.config_financeira
  add column if not exists prioridade_alocacao jsonb;

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled, no policies yet (service-role only until Auth)
-- ---------------------------------------------------------------------------

alter table public.contas_financeiras enable row level security;
alter table public.reservas_financeiras enable row level security;
alter table public.compromissos_financeiros enable row level security;
alter table public.faturas_cartao enable row level security;
alter table public.compras_cartao enable row level security;
alter table public.transferencias enable row level security;
alter table public.movimentacoes_financeiras enable row level security;
alter table public.movimentacoes_reservas enable row level security;
alter table public.pagamentos_compromissos enable row level security;
