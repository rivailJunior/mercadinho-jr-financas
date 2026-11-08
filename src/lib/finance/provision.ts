import { type Cents, assertCents } from "@/lib/money";

export interface ProvisaoInput {
  /** faltaCartao = expected invoice amount − what the card reserve already holds. */
  faltaCartao: Cents;
  /** Days until the invoice due date (clamped to ≥ 1). */
  diasAteFatura: number;
  /** faltaCompromissos = Σ monthly fixed bills − what their reserve already holds. */
  faltaCompromissos: Cents;
  /** Days until the end of the month (clamped to ≥ 1). */
  diasAteFimMes: number;
  /** Consolidated − reserved: money not yet destined to anything. */
  saldoLivre: Cents;
  /** Liquidity that must always remain in the drawer. */
  caixaMinimo: Cents;
}

export interface ProvisaoResult {
  /** faltaCartao ÷ diasAteFatura — daily pace needed for the card. */
  ritmoCartao: Cents;
  /** faltaCompromissos ÷ diasAteFimMes — daily pace needed for the other bills. */
  ritmoCompromissos: Cents;
  ritmoTotal: Cents;
  /** max(0, saldoLivre − caixaMinimo): what can actually be earmarked today. */
  disponivel: Cents;
  /** min(ritmoTotal, disponivel): how much to set aside today. */
  sugerido: Cents;
  /** Card bucket first (nearest deadline), compromissos get the remainder. */
  sugeridoCartao: Cents;
  sugeridoCompromissos: Cents;
}

const pace = (falta: Cents, dias: number): Cents =>
  falta <= 0 ? 0 : Math.floor(assertCents(falta) / Math.max(1, Math.floor(dias)));

/**
 * "Quanto guardar hoje pras contas fixas" — a smoothed daily provision.
 *
 * Each bucket (card invoice; other monthly bills) has its own deadline, so
 * the required pace is falta ÷ diasRestantes. The suggestion is capped by
 * the money actually available after keeping the operational minimum, and
 * the card — the nearest obligation — is funded first. When accumulation is
 * already on track, the pace (and thus the suggestion) naturally shrinks.
 */
export const provisaoDiaria = (input: ProvisaoInput): ProvisaoResult => {
  const ritmoCartao = pace(input.faltaCartao, input.diasAteFatura);
  const ritmoCompromissos = pace(input.faltaCompromissos, input.diasAteFimMes);
  const ritmoTotal = ritmoCartao + ritmoCompromissos;
  const disponivel = Math.max(0, assertCents(input.saldoLivre) - assertCents(input.caixaMinimo));
  const sugerido = Math.min(ritmoTotal, disponivel);
  const sugeridoCartao = Math.min(ritmoCartao, sugerido);
  return {
    ritmoCartao,
    ritmoCompromissos,
    ritmoTotal,
    disponivel,
    sugerido,
    sugeridoCartao,
    sugeridoCompromissos: sugerido - sugeridoCartao,
  };
};
