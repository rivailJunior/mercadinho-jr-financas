-- Auth cutover step 2: replace the temporary open policies on the new
-- financial tables and enable RLS on the five legacy tables.
--
-- Every policy requires an authenticated session whose user is linked to
-- the row's estabelecimento via usuarios_estabelecimentos. Apply ONLY
-- after at least one auth user is linked, or the app locks itself out.

-- ---------- New financial tables: drop open policies, add restrictive ----
do $$
declare
  t text;
begin
  foreach t in array array[
    'contas_financeiras', 'movimentacoes_financeiras', 'transferencias',
    'reservas_financeiras', 'movimentacoes_reservas',
    'compromissos_financeiros', 'pagamentos_compromissos',
    'faturas_cartao', 'compras_cartao'
  ]
  loop
    execute format('drop policy if exists financial_open on public.%I', t);
    execute format(
      'create policy %I_member on public.%I for all to authenticated
         using (public.user_manages_estabelecimento(estabelecimento_id))
         with check (public.user_manages_estabelecimento(estabelecimento_id))',
      t, t);
  end loop;
end $$;

-- ---------- Legacy tables: enable RLS keyed on the same membership -------
alter table public.estabelecimentos enable row level security;
alter table public.categorias enable row level security;
alter table public.lancamentos_caixa enable row level security;
alter table public.custos_fixos_config enable row level security;
alter table public.config_financeira enable row level security;

-- estabelecimentos has no estabelecimento_id column — the row id IS the
-- establishment id.
create policy estabelecimentos_member
  on public.estabelecimentos for all to authenticated
  using (public.user_manages_estabelecimento(id))
  with check (public.user_manages_estabelecimento(id));

-- categorias is a global lookup table (no estabelecimento_id): readable by
-- any authenticated member, not writable through the API.
create policy categorias_read
  on public.categorias for select to authenticated
  using (true);

create policy lancamentos_caixa_member
  on public.lancamentos_caixa for all to authenticated
  using (public.user_manages_estabelecimento(estabelecimento_id))
  with check (public.user_manages_estabelecimento(estabelecimento_id));

create policy custos_fixos_config_member
  on public.custos_fixos_config for all to authenticated
  using (public.user_manages_estabelecimento(estabelecimento_id))
  with check (public.user_manages_estabelecimento(estabelecimento_id));

create policy config_financeira_member
  on public.config_financeira for all to authenticated
  using (public.user_manages_estabelecimento(estabelecimento_id))
  with check (public.user_manages_estabelecimento(estabelecimento_id));

-- ---------- Views must not bypass RLS ------------------------------------
-- Postgres views run as their owner by default, which would expose rows
-- regardless of the base-table policies. security_invoker makes them
-- evaluate as the querying user instead.
alter view public.v_saldos_contas set (security_invoker = on);
alter view public.view_resumo_diario set (security_invoker = on);

-- ---------- Revoke direct anon access: nothing is public anymore --------
do $$
declare
  t text;
begin
  foreach t in array array[
    'estabelecimentos', 'categorias', 'lancamentos_caixa',
    'custos_fixos_config', 'config_financeira',
    'contas_financeiras', 'movimentacoes_financeiras', 'transferencias',
    'reservas_financeiras', 'movimentacoes_reservas',
    'compromissos_financeiros', 'pagamentos_compromissos',
    'faturas_cartao', 'compras_cartao', 'usuarios_estabelecimentos',
    'v_saldos_contas', 'view_resumo_diario'
  ]
  loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- The transactional RPCs run as the invoker — internal row access is
-- already gated by the member policies, but anon should not even reach
-- the function entry points.
revoke execute on function public.criar_transferencia(uuid, uuid, uuid, bigint, date, varchar) from anon;
revoke execute on function public.aportar_reserva(uuid, uuid, bigint, date, varchar) from anon;
revoke execute on function public.retirar_reserva(uuid, uuid, bigint, date, varchar) from anon;
revoke execute on function public.transferir_entre_reservas(uuid, uuid, uuid, bigint, date, varchar) from anon;
revoke execute on function public.pagar_fatura(uuid, uuid, uuid, bigint, date, varchar) from anon;
