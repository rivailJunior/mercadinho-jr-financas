import type { Fatura } from "@/lib/finance/types";
import { type Cents, clampNonNegative } from "@/lib/money";

/**
 * The amount owed for an invoice: the closed amount once the cycle is closed,
 * otherwise the running total of purchases.
 */
export const valorDevido = (f: Pick<Fatura, "valorAtual" | "valorFechado">): Cents =>
  f.valorFechado ?? f.valorAtual;

/**
 * How much more still needs to be reserved to cover the invoice:
 *   devido − reservado, floored at zero.
 */
export const faltaReservarFatura = (f: Fatura): Cents =>
  clampNonNegative(valorDevido(f) - f.valorReservado);

/** How much of the invoice is still outstanding (not yet paid). */
export const saldoPendenteFatura = (f: Fatura): Cents =>
  clampNonNegative(valorDevido(f) - f.valorPago);

/**
 * Settles (pays) part or all of an invoice using money already set aside.
 *
 * Paying the invoice is a *settlement* of an obligation — the underlying card
 * purchases were already recognised as expenses, so this does NOT create a new
 * operational expense. It only moves the invoice toward PAGA and consumes the
 * reserve. The caller is responsible for the matching cash movement.
 *
 * Returns the next invoice state. Any reserve left over after full payment is
 * kept (carried to the next cycle) rather than being zeroed.
 */
export const pagarFatura = (f: Fatura, valorPagamento: Cents): Fatura => {
  if (valorPagamento <= 0) throw new Error("Payment amount must be positive.");
  const pendente = saldoPendenteFatura(f);
  if (valorPagamento > pendente) {
    throw new Error("Payment exceeds the outstanding invoice balance.");
  }
  const novoPago = f.valorPago + valorPagamento;
  // Consume the reserve by what was paid, but never below zero; a surplus stays.
  const novoReservado = clampNonNegative(f.valorReservado - valorPagamento);
  const devido = valorDevido(f);
  const status = novoPago >= devido ? "PAGA" : "PARCIALMENTE_PAGA";
  return { ...f, valorPago: novoPago, valorReservado: novoReservado, status };
};

/**
 * Carries a closed, fully-paid invoice's leftover reserve into the next cycle.
 * The reserve is never reset automatically at month end — any surplus is the
 * opening reserve of the new cycle.
 */
export const transportarReserva = (anterior: Fatura, nova: Fatura): Fatura => ({
  ...nova,
  valorReservado: nova.valorReservado + anterior.valorReservado,
});
