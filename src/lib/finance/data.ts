import { monthBounds, todayISODate } from "@/lib/dates";
import {
  type Compromisso,
  type Conta,
  type Fatura,
  type PosicaoFinanceira,
  type ProvisaoResult,
  type Recomendacao,
  type Reserva,
  posicaoFinanceira,
  provisaoDiaria,
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
  const supabase = await createSupabaseClient();
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
  const supabase = await createSupabaseClient();
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

// --- Provisão diária ("quanto guardar hoje pras contas fixas") ----------------

export interface ProvisaoPainel {
  esperadoCartao: Cents;
  reservadoCartao: Cents;
  faltaCartao: Cents;
  totalCompromissos: Cents;
  reservadoCompromissos: Cents;
  faltaCompromissos: Cents;
  saldoLivre: Cents;
  caixaMinimo: Cents;
  diasAteFatura: number;
  diasAteFimMes: number;
  reservaCartaoId: string | null;
  reservaCompromissosId: string | null;
  resultado: ProvisaoResult;
}

const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round(
    (new Date(`${toIso}T12:00:00Z`).getTime() - new Date(`${fromIso}T12:00:00Z`).getTime()) /
      86_400_000,
  );

/**
 * Computes the smoothed daily provision: each bucket (card invoice; other
 * monthly bills) needs falta ÷ diasRestantes, capped by the free cash that
 * remains after the operational minimum. The card bucket is funded first
 * because its deadline is nearest.
 */
export const getProvisaoDiaria = async (): Promise<ProvisaoPainel | null> => {
  const painel = await getPainelFinanceiro();
  if (!painel) return null;

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return null;

  const hoje = todayISODate();
  const fimMes = monthBounds(hoje.slice(0, 7)).end;

  // The card bucket's reserve comes from the fatura's reserva_id link; the
  // compromissos bucket's reserve comes from the compromissos' reserva_id.
  const faturaAberta = painel.faturas.find(
    (f) => f.status === "ABERTA" || f.status === "FECHADA" || f.status === "PARCIALMENTE_PAGA",
  );
  const [{ data: faturaRow }, { data: compromissoLinks }] = await Promise.all([
    faturaAberta
      ? supabase.from("faturas_cartao").select("reserva_id").eq("id", faturaAberta.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("compromissos_financeiros")
      .select("reserva_id")
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null),
  ]);

  const reservaById = new Map(painel.reservas.map((r) => [r.id, r]));
  const reservaCartao = faturaRow?.reserva_id ? reservaById.get(faturaRow.reserva_id) : undefined;
  const reservaCompromissosIds = new Set(
    (compromissoLinks ?? []).map((c) => c.reserva_id).filter((id): id is string => id != null),
  );
  const reservadoCompromissos = [...reservaCompromissosIds].reduce(
    (acc, id) => acc + (reservaById.get(id)?.valorAtual ?? 0),
    0,
  );

  // Expected invoice: closed amount when the cycle is closed; otherwise the
  // larger of the reserve's meta and the running purchases total.
  const esperadoCartao = faturaAberta
    ? (faturaAberta.valorFechado ?? Math.max(reservaCartao?.meta ?? 0, faturaAberta.valorAtual))
    : 0;
  const reservadoCartao = reservaCartao?.valorAtual ?? 0;
  const faltaCartao = Math.max(0, esperadoCartao - reservadoCartao);

  const totalCompromissos = painel.compromissos
    .filter((c) => c.status !== "PAGO")
    .reduce((acc, c) => acc + (c.valorEfetivo ?? c.valorPrevisto), 0);
  const faltaCompromissos = Math.max(0, totalCompromissos - reservadoCompromissos);

  // Provision against the closing date (fechamento), not the due date: the
  // family wants the invoice fully funded by the time the cycle closes.
  const diasAteFatura = faturaAberta ? Math.max(1, daysBetween(hoje, faturaAberta.fechamento)) : 1;
  const diasAteFimMes = Math.max(1, daysBetween(hoje, fimMes));

  const resultado = provisaoDiaria({
    faltaCartao,
    diasAteFatura,
    faltaCompromissos,
    diasAteFimMes,
    saldoLivre: painel.posicao.saldoLivre,
    caixaMinimo: painel.caixaMinimo,
  });

  return {
    esperadoCartao,
    reservadoCartao,
    faltaCartao,
    totalCompromissos,
    reservadoCompromissos,
    faltaCompromissos,
    saldoLivre: painel.posicao.saldoLivre,
    caixaMinimo: painel.caixaMinimo,
    diasAteFatura,
    diasAteFimMes,
    reservaCartaoId: reservaCartao?.id ?? null,
    reservaCompromissosId:
      reservaCompromissosIds.size === 1 ? [...reservaCompromissosIds][0] : null,
    resultado,
  };
};
