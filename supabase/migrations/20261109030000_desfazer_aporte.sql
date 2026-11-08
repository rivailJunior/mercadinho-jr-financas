-- desfazer_aporte_reserva — reverses an APORTE: releases the earmarked amount
-- back to "saldo livre" and removes the audit row. Only APORTE movements can
-- be undone this way; RETIRADA/TRANSFERENCIA legs are already paired effects.
create or replace function public.desfazer_aporte_reserva(
  p_movimentacao_id uuid
)
returns void
language plpgsql
as $$
declare
  v_mov public.movimentacoes_reservas%rowtype;
begin
  select * into v_mov
  from public.movimentacoes_reservas
  where id = p_movimentacao_id
  for update;

  if not found then raise exception 'movimento nao encontrado'; end if;
  if v_mov.tipo <> 'APORTE' then
    raise exception 'apenas aportes podem ser desfeitos';
  end if;

  update public.reservas_financeiras
  set valor_atual_centavos = valor_atual_centavos - v_mov.valor_centavos
  where id = v_mov.reserva_id
    and estabelecimento_id = v_mov.estabelecimento_id
    and deleted_at is null
    and valor_atual_centavos >= v_mov.valor_centavos;
  if not found then
    raise exception 'reserva ja consumida por um pagamento — desfaca o pagamento antes';
  end if;

  delete from public.movimentacoes_reservas where id = v_mov.id;
end;
$$;
