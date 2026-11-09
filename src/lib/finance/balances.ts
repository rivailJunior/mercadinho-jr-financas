import type { Conta, Movimento, Reserva } from "@/lib/finance/types";
import { type Cents, assertCents, sumCents } from "@/lib/money";

/**
 * Current balance of a single account: saldoInicial + Σ(entradas) − Σ(saídas).
 * There is a single source of truth — the balance is always derived from the
 * initial balance plus the real movements, never stored independently.
 */
export const saldoConta = (conta: Conta, movimentos: Movimento[]): Cents => {
  const delta = movimentos
    .filter((m) => m.contaId === conta.id)
    .reduce((acc, m) => acc + (m.tipo === "ENTRADA" ? m.valor : -m.valor), 0);
  return assertCents(conta.saldoInicial + delta);
};

/** Consolidated balance across all accounts (the real total money available). */
export const saldoConsolidado = (contas: Conta[], movimentos: Movimento[]): Cents =>
  contas.reduce((acc, c) => acc + saldoConta(c, movimentos), 0);

/** Total money logically earmarked across all reserves. */
export const totalReservado = (reservas: Reserva[]): Cents =>
  sumCents(...reservas.map((r) => r.valorAtual));

export interface PosicaoFinanceira {
  /** Σ accounts — the real total money. */
  saldoConsolidado: Cents;
  /** Σ reserves — money already destined to a purpose. */
  totalReservado: Cents;
  /** Consolidated − reserved: money not yet destined (can still be negative-safe). */
  saldoLivre: Cents;
}

/**
 * A single consistent snapshot of the two dimensions: where the money is
 * (accounts) and what it is destined to (reserves).
 *
 * Invariant exposed by `saldoLivre`: the same money is never counted both as
 * free and as reserved — free is exactly what is left after earmarking.
 */
export const posicaoFinanceira = (
  contas: Conta[],
  movimentos: Movimento[],
  reservas: Reserva[],
): PosicaoFinanceira => {
  const consolidado = saldoConsolidado(contas, movimentos);
  const reservado = totalReservado(reservas);
  return {
    saldoConsolidado: consolidado,
    totalReservado: reservado,
    saldoLivre: consolidado - reservado,
  };
};

/**
 * Validates that reserves do not exceed the money that actually exists.
 * Returns true when the earmarking is consistent (reservado ≤ consolidado).
 */
export const reservasConsistentes = (
  contas: Conta[],
  movimentos: Movimento[],
  reservas: Reserva[],
): boolean => totalReservado(reservas) <= saldoConsolidado(contas, movimentos);
