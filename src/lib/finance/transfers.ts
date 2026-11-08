import type { Movimento } from "@/lib/finance/types";
import { type Cents, assertCents } from "@/lib/money";

export interface Transferencia {
  contaOrigemId: string;
  contaDestinoId: string;
  valor: Cents;
}

/**
 * Expands an internal transfer into the two movements it produces: a SAIDA on
 * the source account and an ENTRADA on the destination.
 *
 * A transfer is never a revenue or an expense: the source decreases, the
 * destination increases, and the consolidated balance stays exactly the same.
 */
export const transferenciaParaMovimentos = (t: Transferencia): [Movimento, Movimento] => {
  assertCents(t.valor);
  if (t.valor <= 0) throw new Error("Transfer amount must be positive.");
  if (t.contaOrigemId === t.contaDestinoId) {
    throw new Error("Transfer source and destination must differ.");
  }
  return [
    { contaId: t.contaOrigemId, tipo: "SAIDA", valor: t.valor },
    { contaId: t.contaDestinoId, tipo: "ENTRADA", valor: t.valor },
  ];
};
