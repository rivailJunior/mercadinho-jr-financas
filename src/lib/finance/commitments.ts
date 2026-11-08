import type { Compromisso, CompromissoStatus } from "@/lib/finance/types";
import { type Cents, clampNonNegative } from "@/lib/money";

/**
 * The amount that should ultimately be covered for a commitment: the actual
 * amount when known, otherwise the forecast. This avoids double counting by
 * never summing previsto and efetivo together.
 */
export const valorAlvo = (c: Pick<Compromisso, "valorPrevisto" | "valorEfetivo">): Cents =>
  c.valorEfetivo ?? c.valorPrevisto;

/**
 * How much still needs to be reserved for a commitment:
 *   alvo − já reservado − já pago, floored at zero.
 *
 * Both `valorReservado` and `valorPago` are already-recognised amounts, so each
 * is subtracted exactly once — a value that was paid is not also expected to be
 * reserved again.
 */
export const faltaReservar = (c: Compromisso): Cents =>
  clampNonNegative(valorAlvo(c) - c.valorReservado - c.valorPago);

/** How much of a commitment is still outstanding (not yet paid). */
export const faltaPagar = (c: Compromisso): Cents => clampNonNegative(valorAlvo(c) - c.valorPago);

/**
 * Derives the status from the amounts, independent of any stored status, so the
 * displayed state can never drift from the real numbers.
 *
 * `hoje` is an ISO YYYY-MM-DD string used to flag overdue (vencido) items.
 */
export const derivarStatus = (c: Compromisso, hoje: string): CompromissoStatus => {
  const alvo = valorAlvo(c);
  if (alvo > 0 && c.valorPago >= alvo) return "PAGO";
  if (c.vencimento && c.vencimento < hoje) return "VENCIDO";
  const coberto = c.valorReservado + c.valorPago;
  if (coberto >= alvo && alvo > 0) return "RESERVADO";
  if (c.valorPago > 0) return "PARCIALMENTE_PAGO";
  if (coberto > 0) return "PARCIALMENTE_RESERVADO";
  return "PENDENTE";
};

/** Total still-to-reserve across a set of commitments. */
export const totalFaltaReservar = (compromissos: Compromisso[]): Cents =>
  compromissos.reduce((acc, c) => acc + faltaReservar(c), 0);

/** Commitments due on or before `limite` (ISO date), still not fully paid. */
export const compromissosProximos = (compromissos: Compromisso[], limite: string): Compromisso[] =>
  compromissos.filter((c) => c.vencimento <= limite && faltaPagar(c) > 0);
