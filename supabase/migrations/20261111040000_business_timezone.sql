-- Business timezone fix — "current_date" must follow the store's day.
--
-- Column defaults (movimentacoes_reservas.data_referencia, etc.) and RPC
-- defaults (aportar_reserva.p_data_referencia, pagar_fatura, ...) all rely on
-- current_date, which Postgres resolves in the session timezone. The database
-- runs in UTC, so any write after 20:00 America/Manaus (UTC-4) was stamped
-- with the next calendar day.
--
-- Server actions now pass p_data_referencia explicitly in America/Manaus, and
-- this default makes every other current_date resolution consistent for any
-- path that relies on the DB default. Timestamptz values (created_at, etc.)
-- are unaffected — timezone only changes how instants are displayed and how
-- current_date/localtimestamp resolve. Applies to new sessions.

alter database postgres set timezone to 'America/Manaus';
