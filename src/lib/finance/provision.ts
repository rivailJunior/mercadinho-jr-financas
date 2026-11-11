import { type Cents, assertCents } from "@/lib/money";

export interface ProvisaoInput {
  /** faltaCartao = expected invoice amount − what the card reserve already holds. */
  faltaCartao: Cents;
  /** Days until the invoice due date (clamped to ≥ 1). */
  diasAteFatura: number;
  /** faltaCompromissos = Σ monthly fixed bills − what their reserve already holds. */
  faltaCompromissos: Cents;
  /** Days in the provision cycle for commitments — bills fund at valor ÷ 30 per day. */
  diasAteCompromissos: number;
  /** Today's net profit ("Livre de Verdade") — the source of today's earmark. */
  lucroDia: Cents;
  /** True once today's provision was already executed — the button stays inactive. */
  jaGuardouHoje: boolean;
  /** Consolidated − reserved: absolute ceiling for any earmark. */
  saldoLivre: Cents;
}

export interface ProvisaoResult {
  /** faltaCartao ÷ diasAteFatura — daily pace needed for the card. */
  ritmoCartao: Cents;
  /** faltaCompromissos ÷ diasAteFimMes — daily pace needed for the other bills. */
  ritmoCompromissos: Cents;
  ritmoTotal: Cents;
  /** max(0, lucroDia): the day's profit available to split. */
  disponivel: Cents;
  /** The day's profit into fixed bills; 0 when negative or already saved. */
  sugerido: Cents;
  /** Card bucket first (nearest deadline), compromissos get the remainder. */
  sugeridoCartao: Cents;
  sugeridoCompromissos: Cents;
  /** What stays in the drawer — whatever exceeds the remaining gap. */
  sobraCaixa: Cents;
}

const pace = (falta: Cents, dias: number): Cents =>
  falta <= 0 ? 0 : Math.floor(assertCents(falta) / Math.max(1, Math.floor(dias)));

/**
 * "Quanto guardar hoje pras contas fixas" — driven by the day's profit.
 *
 * When the day's "Livre de Verdade" is positive, the whole amount is
 * earmarked to the fixed-bill envelopes (card first, nearest deadline).
 * The suggestion is capped by the total remaining gap and by the money
 * that is actually free, and it runs once per day — after today's aporte
 * the suggestion goes to zero. The ritmo fields remain informational:
 * they show the pace needed to cover each gap by its deadline.
 */
export const provisaoDiaria = (input: ProvisaoInput): ProvisaoResult => {
  const ritmoCartao = pace(input.faltaCartao, input.diasAteFatura);
  const ritmoCompromissos = pace(input.faltaCompromissos, input.diasAteCompromissos);
  const ritmoTotal = ritmoCartao + ritmoCompromissos;
  const disponivel = Math.max(0, assertCents(input.lucroDia));
  const sugerido = input.jaGuardouHoje
    ? 0
    : Math.max(
        0,
        Math.min(
          disponivel,
          input.faltaCartao + input.faltaCompromissos,
          assertCents(input.saldoLivre),
        ),
      );
  const sugeridoCartao = Math.min(sugerido, input.faltaCartao);
  return {
    ritmoCartao,
    ritmoCompromissos,
    ritmoTotal,
    disponivel,
    sugerido,
    sugeridoCartao,
    sugeridoCompromissos: sugerido - sugeridoCartao,
    sobraCaixa: disponivel - sugerido,
  };
};
