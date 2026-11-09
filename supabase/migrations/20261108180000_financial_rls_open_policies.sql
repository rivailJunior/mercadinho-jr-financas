-- Permissive policies on the new financial tables so the app (anon key) can
-- use them end-to-end today, matching the existing open posture of the legacy
-- tables (which still have RLS disabled). These are intentionally broad and
-- will be replaced by per-establishment/per-user policies at the Auth cutover.
--
-- NOTE: `if not exists` is not supported by CREATE POLICY; each policy name is
-- unique per table so a fresh apply is safe.

create policy financial_open on public.contas_financeiras for all using (true) with check (true);
create policy financial_open on public.reservas_financeiras for all using (true) with check (true);
create policy financial_open on public.compromissos_financeiros for all using (true) with check (true);
create policy financial_open on public.faturas_cartao for all using (true) with check (true);
create policy financial_open on public.compras_cartao for all using (true) with check (true);
create policy financial_open on public.transferencias for all using (true) with check (true);
create policy financial_open on public.movimentacoes_financeiras for all using (true) with check (true);
create policy financial_open on public.movimentacoes_reservas for all using (true) with check (true);
create policy financial_open on public.pagamentos_compromissos for all using (true) with check (true);
