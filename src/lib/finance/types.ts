import type { Cents } from "@/lib/money";

/** Where the money physically lives. */
export type ContaTipo = "CAIXA_FISICO" | "MAQUININHA" | "BANCO";

/** A direction of a real cash movement. */
export type MovimentoTipo = "ENTRADA" | "SAIDA";

/** Status of a financial commitment (conta a pagar). */
export type CompromissoStatus =
  | "PENDENTE"
  | "PARCIALMENTE_RESERVADO"
  | "RESERVADO"
  | "PARCIALMENTE_PAGO"
  | "PAGO"
  | "VENCIDO";

/** Status of a credit-card invoice cycle. */
export type FaturaStatus = "ABERTA" | "FECHADA" | "PARCIALMENTE_PAGA" | "PAGA" | "VENCIDA";

/**
 * A financial account — a *location* of money (caixa físico, maquininha, bank).
 * The current balance is always derived: saldoInicial + Σ movimentos.
 */
export interface Conta {
  id: string;
  nome: string;
  tipo: ContaTipo;
  saldoInicial: Cents;
  ativo: boolean;
}

/** A real cash movement affecting a single account. */
export interface Movimento {
  contaId: string;
  tipo: MovimentoTipo;
  valor: Cents;
}

/**
 * A logical reserve (envelope) — a *destination* of money that already exists.
 * It never represents new money and never changes the consolidated balance.
 */
export interface Reserva {
  id: string;
  nome: string;
  valorAtual: Cents;
  /** Optional target used only as a safety reference, never an obligation. */
  meta?: Cents;
  prioridade: number;
}

/** A financial commitment (recurring or one-off) that may require reserving. */
export interface Compromisso {
  id: string;
  nome: string;
  /** Reference amount; may be overridden by the actual amount when known. */
  valorPrevisto: Cents;
  /** Actual amount once known (e.g. the closed invoice). Takes precedence. */
  valorEfetivo?: Cents;
  /** Amount already set aside for this commitment. */
  valorReservado: Cents;
  /** Amount already paid toward this commitment. */
  valorPago: Cents;
  /** Due date as an ISO YYYY-MM-DD string. */
  vencimento: string;
  prioridade: number;
  status: CompromissoStatus;
}

/** A credit-card invoice cycle. The reserve may accumulate across cycles. */
export interface Fatura {
  id: string;
  /** Closing date (ISO YYYY-MM-DD). */
  fechamento: string;
  /** Due date (ISO YYYY-MM-DD) — typically day 20. */
  vencimento: string;
  /** Running total of purchases in the cycle (before it closes). */
  valorAtual: Cents;
  /** The amount locked in once the cycle closes. */
  valorFechado?: Cents;
  /** Amount reserved for this invoice (may carry over between cycles). */
  valorReservado: Cents;
  /** Amount already paid toward this invoice. */
  valorPago: Cents;
  status: FaturaStatus;
}
