import type { Reserva } from "@/lib/finance/types";
import { type Cents, clampNonNegative } from "@/lib/money";

/**
 * Adds money to a reserve. This earmarks money that already exists; it does not
 * change the consolidated balance (that lives in accounts, not reserves).
 */
export const aportarReserva = (reserva: Reserva, valor: Cents): Reserva => {
  if (valor <= 0) throw new Error("Aporte amount must be positive.");
  return { ...reserva, valorAtual: reserva.valorAtual + valor };
};

/** Removes money from a reserve, never below zero. */
export const retirarReserva = (reserva: Reserva, valor: Cents): Reserva => {
  if (valor <= 0) throw new Error("Retirada amount must be positive.");
  if (valor > reserva.valorAtual) throw new Error("Retirada exceeds the reserve balance.");
  return { ...reserva, valorAtual: reserva.valorAtual - valor };
};

/**
 * Moves money between two reserves. The total across reserves is unchanged, so
 * the consolidated balance and the total reserved both stay the same.
 */
export const transferirEntreReservas = (
  origem: Reserva,
  destino: Reserva,
  valor: Cents,
): [Reserva, Reserva] => {
  if (origem.id === destino.id) throw new Error("Reserves must differ.");
  return [retirarReserva(origem, valor), aportarReserva(destino, valor)];
};

/** How much a reserve still needs to reach its target (meta), if any. */
export const faltaParaMeta = (reserva: Reserva): Cents =>
  reserva.meta == null ? 0 : clampNonNegative(reserva.meta - reserva.valorAtual);
