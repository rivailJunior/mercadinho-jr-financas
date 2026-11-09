-- Link daily-cash lancamentos to their mirrored financial movements so a
-- delete on lancamentos_caixa also removes the movement (keeps balances in
-- sync) and the pair can be traced both ways.
alter table public.movimentacoes_financeiras
  add column if not exists lancamento_id uuid references public.lancamentos_caixa(id) on delete cascade;

create index if not exists movimentacoes_lancamento_idx
  on public.movimentacoes_financeiras(lancamento_id);
