-- Fix desfazer_transferencia: it still referenced fatura_id, which was dropped
-- in 20261118120000_fatura_vira_compromisso — every undo call failed with
-- "column fatura_id does not exist". Only compromisso_id marks a settlement
-- transfer now.

create or replace function public.desfazer_transferencia(
  p_transferencia_id uuid
)
returns void
language plpgsql
as $$
declare
  v_t public.transferencias%rowtype;
begin
  select * into v_t
  from public.transferencias
  where id = p_transferencia_id and deleted_at is null
  for update;
  if not found then raise exception 'transferencia nao encontrada'; end if;

  if exists (
    select 1 from public.movimentacoes_financeiras
    where transferencia_id = p_transferencia_id
      and deleted_at is null
      and compromisso_id is not null
  ) then
    raise exception 'transferencia vinculada a um pagamento — desfaca pela aba Pagamentos';
  end if;

  delete from public.movimentacoes_financeiras where transferencia_id = p_transferencia_id;
  delete from public.transferencias where id = p_transferencia_id;
end;
$$;

revoke execute on function public.desfazer_transferencia(uuid) from anon;
