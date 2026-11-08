import { type Cents, clampNonNegative } from "@/lib/money";

/**
 * A destination that can receive an allocation (a commitment gap, an invoice
 * gap, or a reserve below its target). Targets are provided already ordered by
 * priority — the caller decides the order (configurable), e.g. nearest due
 * date → card invoice → pró-labore → água/energia → funcionários → others →
 * emergency → investments.
 */
export interface AlvoAlocacao {
  id: string;
  nome: string;
  /** How much this target still needs. */
  falta: Cents;
  /** ISO YYYY-MM-DD due date, when applicable (used only for reporting). */
  vencimento?: string;
}

export interface RecomendacaoItem {
  id: string;
  nome: string;
  recomendado: Cents;
  falta: Cents;
}

export interface EntradaAlocacao {
  /** Consolidated balance across all accounts. */
  saldoConsolidado: Cents;
  /** Total already earmarked across reserves. */
  totalReservado: Cents;
  /** Minimum operating cash that must remain available. */
  caixaMinimo: Cents;
  /** Allocation targets, already ordered by priority. */
  alvos: AlvoAlocacao[];
}

export interface Recomendacao {
  /** Total that can be allocated today. */
  totalRecomendado: Cents;
  /** Per-target recommendation (same order as the input targets). */
  itens: RecomendacaoItem[];
  /** Money that should remain free/unallocated after following the plan. */
  manterDisponivel: Cents;
  /** True when the consolidated balance is below the operating minimum. */
  abaixoDoMinimo: boolean;
  /** Targets that remain below their need after the recommendation. */
  abaixoDaMeta: RecomendacaoItem[];
}

/**
 * Recommends how much of the available money can be allocated today, following
 * the five steps of the dynamic allocation model. It never fixes a daily amount
 * and never executes anything — it only produces a recommendation to confirm.
 *
 *   disponível = saldoConsolidado − totalReservado − caixaMínimo
 *
 * Each term is subtracted exactly once (no double discount): money already in
 * reserves is excluded via `totalReservado`, and the operating buffer via
 * `caixaMinimo`. On a low-revenue / below-minimum day the available amount is
 * zero, so the recommendation is zero across the board. On a high-revenue day
 * the surplus flows to the highest-priority gaps first, which naturally lets a
 * good day compensate previous ones.
 */
export const recomendarAlocacao = (entrada: EntradaAlocacao): Recomendacao => {
  const { saldoConsolidado, totalReservado, caixaMinimo, alvos } = entrada;

  const abaixoDoMinimo = saldoConsolidado < caixaMinimo;
  const disponivel = clampNonNegative(saldoConsolidado - totalReservado - caixaMinimo);

  let restante = abaixoDoMinimo ? 0 : disponivel;
  const itens: RecomendacaoItem[] = alvos.map((alvo) => {
    const falta = clampNonNegative(alvo.falta);
    const recomendado = Math.min(falta, restante);
    restante -= recomendado;
    return { id: alvo.id, nome: alvo.nome, recomendado, falta };
  });

  const totalRecomendado = itens.reduce((acc, i) => acc + i.recomendado, 0);
  const abaixoDaMeta = itens.filter((i) => i.recomendado < i.falta);

  return {
    totalRecomendado,
    itens,
    // Whatever free money was not allocated stays available on top of the
    // operating minimum that was already protected.
    manterDisponivel: caixaMinimo + restante,
    abaixoDoMinimo,
    abaixoDaMeta,
  };
};
