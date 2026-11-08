import {
  type Compromisso,
  type Conta,
  type Fatura,
  type PosicaoFinanceira,
  type Recomendacao,
  type Reserva,
  posicaoFinanceira,
  recomendarAlocacao,
} from "@/lib/finance";
import type { Cents } from "@/lib/money";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface PainelFinanceiro {
  posicao: PosicaoFinanceira;
  contas: (Conta & { saldoAtual: Cents })[];
  reservas: Reserva[];
  compromissos: Compromisso[];
  faturas: Fatura[];
  caixaMinimo: Cents;
  recomendacao: Recomendacao;
}

/** Resolves the default establishment id (single-store app). */
export const getEstabelecimentoId = async (): Promise<string | null> => {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("estabelecimentos")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
};

/**
 * Loads the real financial position for the default establishment and runs the
 * dynamic allocation recommendation on top of it.
 *
 * Money is read in integer cents (bigint) straight from the new v2 tables —
 * no float arithmetic anywhere.
 */
export const getPainelFinanceiro = async (): Promise<PainelFinanceiro | null> => {
  const supabase = createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return null;

  const [
    { data: saldos },
    { data: reservasRows },
    { data: compromissosRows },
    { data: faturasRows },
    { data: configRow },
  ] = await Promise.all([
    supabase
      .from("v_saldos_contas")
      .select("id, nome, tipo, ativo, saldo_atual_centavos")
      .eq("estabelecimento_id", estabelecimentoId),
    supabase
      .from("reservas_financeiras")
      .select("id, nome, valor_atual_centavos, meta_centavos, prioridade")
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null),
    supabase
      .from("compromissos_financeiros")
      .select(
        "id, nome, valor_previsto_centavos, valor_efetivo_centavos, prioridade, vencimento, status",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null),
    supabase
      .from("faturas_cartao")
      .select(
        "id, fechamento, vencimento, valor_fechado_centavos, valor_reservado_centavos, valor_pago_centavos, status, compras_cartao(valor_centavos)",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null),
    supabase
      .from("config_financeira")
      .select("caixa_minimo_centavos")
      .eq("estabelecimento_id", estabelecimentoId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  // v_saldos_contas already derives each account's current balance
  // (saldo_inicial + Σ movimentos). We feed the domain each account's real
  // opening balance folded into saldoInicial and, separately, keep saldoAtual
  // for the dashboard. For the position computation the movements list below
  // reproduces the same delta, so Σ stays consistent.
  const contas: (Conta & { saldoAtual: Cents })[] = (saldos ?? [])
    .filter(
      (s): s is typeof s & { id: string; nome: string; tipo: NonNullable<typeof s.tipo> } =>
        s.id != null && s.nome != null && s.tipo != null,
    )
    .map((s) => ({
      id: s.id,
      nome: s.nome,
      tipo: s.tipo,
      saldoInicial: s.saldo_atual_centavos ?? 0,
      ativo: s.ativo ?? true,
      saldoAtual: s.saldo_atual_centavos ?? 0,
    }));

  const reservas: Reserva[] = (reservasRows ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    valorAtual: r.valor_atual_centavos,
    meta: r.meta_centavos ?? undefined,
    prioridade: r.prioridade,
  }));

  const compromissos: Compromisso[] = (compromissosRows ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    valorPrevisto: c.valor_previsto_centavos,
    valorEfetivo: c.valor_efetivo_centavos ?? undefined,
    valorReservado: 0,
    valorPago: 0,
    vencimento: c.vencimento ?? "",
    prioridade: c.prioridade,
    status: c.status,
  }));

  const faturas: Fatura[] = (faturasRows ?? []).map((f) => {
    // Open cycles have no closed amount yet — the running total is the sum of
    // the card purchases registered in the cycle.
    const cicloAberto = (f.compras_cartao ?? []).reduce(
      (acc, c) => acc + (c.valor_centavos ?? 0),
      0,
    );
    return {
      id: f.id,
      fechamento: f.fechamento,
      vencimento: f.vencimento,
      valorAtual: f.valor_fechado_centavos ?? cicloAberto,
      valorFechado: f.valor_fechado_centavos ?? undefined,
      valorReservado: f.valor_reservado_centavos,
      valorPago: f.valor_pago_centavos,
      status: f.status,
    };
  });

  const caixaMinimo = configRow?.caixa_minimo_centavos ?? 0;

  // The consolidated balance comes straight from the derived view; pass an
  // empty movements list so we don't double-count them on top of saldo_atual.
  const posicao = posicaoFinanceira(contas, [], reservas);

  const alvos = [
    ...compromissos.map((c) => ({
      id: c.id,
      nome: c.nome,
      falta: Math.max(0, (c.valorEfetivo ?? c.valorPrevisto) - c.valorReservado - c.valorPago),
      vencimento: c.vencimento,
      prioridade: c.prioridade,
    })),
    ...faturas.map((f) => ({
      id: f.id,
      nome: `Fatura ${f.vencimento}`,
      falta: Math.max(0, (f.valorFechado ?? f.valorAtual) - f.valorReservado),
      vencimento: f.vencimento,
      prioridade: 1,
    })),
    ...reservas
      .filter((r) => r.meta != null)
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        falta: Math.max(0, (r.meta ?? 0) - r.valorAtual),
        vencimento: undefined as string | undefined,
        prioridade: r.prioridade,
      })),
  ]
    .sort((a, b) => a.prioridade - b.prioridade)
    .map(({ id, nome, falta, vencimento }) => ({ id, nome, falta, vencimento }));

  const recomendacao = recomendarAlocacao({
    saldoConsolidado: posicao.saldoConsolidado,
    totalReservado: posicao.totalReservado,
    caixaMinimo,
    alvos,
  });

  return {
    posicao,
    contas,
    reservas,
    compromissos,
    faturas,
    caixaMinimo,
    recomendacao,
  };
};
