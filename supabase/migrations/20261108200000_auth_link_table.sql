-- Auth cutover step 1: link table between Supabase Auth users and the
-- estabelecimento they manage. Restrictive table policies (applied in a
-- later migration) key RLS on this mapping.

create table if not exists public.usuarios_estabelecimentos (
  user_id uuid not null references auth.users (id) on delete cascade,
  estabelecimento_id uuid not null references public.estabelecimentos (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, estabelecimento_id)
);

alter table public.usuarios_estabelecimentos enable row level security;

-- Each user can only see their own establishment links.
drop policy if exists usuarios_estabelecimentos_select_own on public.usuarios_estabelecimentos;
create policy usuarios_estabelecimentos_select_own
  on public.usuarios_estabelecimentos
  for select
  to authenticated
  using (user_id = auth.uid());

-- Helper used by the restrictive policies: does the current user manage
-- this establishment? security definer avoids recursive RLS on the link
-- table itself; search_path is pinned per Supabase hardening guidance.
create or replace function public.user_manages_estabelecimento(p_estabelecimento_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_estabelecimentos ue
    where ue.user_id = auth.uid()
      and ue.estabelecimento_id = p_estabelecimento_id
  );
$$;

revoke all on function public.user_manages_estabelecimento(uuid) from public;
grant execute on function public.user_manages_estabelecimento(uuid) to authenticated;
