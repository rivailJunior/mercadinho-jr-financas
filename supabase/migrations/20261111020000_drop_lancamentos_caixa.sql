-- Consolidate lancamentos_caixa into movimentacoes_financeiras (phase 2).
--
-- Phase 1 backfilled every lancamento into movimentacoes_financeiras and
-- repointed view_resumo_diario; the app now reads and writes only the
-- movements table. The link column and the legacy table go away.

alter table public.movimentacoes_financeiras
  drop column if exists lancamento_id;

drop table public.lancamentos_caixa;
