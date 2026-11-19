import { monthBounds, todayISODate } from "@/lib/dates";
import {
  type Compromisso,
  type Conta,
  type PosicaoFinanceira,
  type ProvisaoResult,
  type Reserva,
  acumuladoCiclo,
  derivarStatus,
  posicaoFinanceira,
  provisaoDiaria,
} from "@/lib/finance";
import type { Cents } from "@/lib/money";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface MovimentoReserva {
  id: string;
  tipo: "APORTE" | "RETIRADA" | "TRANSFERENCIA" | string;
  valor: Cents;
  dataReferencia: string;
  descricao: string | null;
  reservaNome: string;
}

export interface Transferencia {
  id: string;
  valor: Cents;
  dataReferencia: string;
  descricao: string | null;
  origemNome: string;
  destinoNome: string;
}

export interface Pagamento {
  id: string;
  natureza: "LIQUIDACAO_FATURA" | "LIQUIDACAO_COMPROMISSO" | "TRANSFERENCIA" | string;
  valor: Cents;
  dataReferencia: string;
  descricao: string | null;
  contaNome: string;
  compromissoNome: string | null;
  /** Set when the payment settled internally via a transfer. */
  transferenciaId: string | null;
}

export interface PainelFinanceiro {
  posicao: PosicaoFinanceira;
  contas: (Conta & { saldoAtual: Cents })[];
  reservas: (Reserva & { metaEfetiva: Cents | null })[];
  compromissos: Compromisso[];
  movimentosReserva: MovimentoReserva[];
  transferencias: Transferencia[];
  pagamentos: Pagamento[];
  /** Money in the fixed-bill reserves beyond the accrued daily rhythm. */
  adiantadoFixas: Cents;
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
 * Loads the real financial position for the default establishment.
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
    { data: movReservaRows },
    { data: transferenciasRows },
    { data: pagamentosRows },
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
        "id, nome, valor_previsto_centavos, valor_efetivo_centavos, valor_pago_centavos, prioridade, vencimento, status, reserva_id",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null),
    supabase
      .from("movimentacoes_reservas")
      .select(
        "id, tipo, valor_centavos, data_referencia, descricao, reservas_financeiras!movimentacoes_reservas_reserva_id_fkey(nome)",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("transferencias")
      .select(
        "id, valor_centavos, data_referencia, descricao, origem:contas_financeiras!transferencias_conta_origem_id_fkey(nome), destino:contas_financeiras!transferencias_conta_destino_id_fkey(nome)",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("movimentacoes_financeiras")
      .select(
        "id, natureza, valor_centavos, data_referencia, descricao, transferencia_id, contas_financeiras!movimentacoes_financeiras_conta_id_fkey(nome), compromissos_financeiros!movimentacoes_financeiras_compromisso_id_fkey(nome)",
      )
      .eq("estabelecimento_id", estabelecimentoId)
      .is("deleted_at", null)
      .or(
        "natureza.in.(LIQUIDACAO_FATURA,LIQUIDACAO_COMPROMISSO),and(natureza.eq.TRANSFERENCIA,compromisso_id.not.is.null,tipo.eq.SAIDA)",
      )
      .order("created_at", { ascending: false })
      .limit(20),
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

  // Effective reserve target: the explicit meta wins; otherwise derive it
  // from the obligations linked to the reserve (pending commitments, open
  // invoices) so every envelope shows its progress bar and "falta".
  const metaDerivada = new Map<string, Cents>();
  const addMeta = (reservaId: string | null, valor: number) => {
    if (reservaId != null && valor > 0)
      metaDerivada.set(reservaId, (metaDerivada.get(reservaId) ?? 0) + valor);
  };
  for (const c of compromissosRows ?? []) {
    if (c.status !== "PAGO")
      addMeta(c.reserva_id, c.valor_efetivo_centavos ?? c.valor_previsto_centavos);
  }

  const reservas = (reservasRows ?? []).map((r) => ({
    id: r.id,
    nome: r.nome,
    valorAtual: r.valor_atual_centavos,
    meta: r.meta_centavos ?? undefined,
    metaEfetiva: r.meta_centavos ?? metaDerivada.get(r.id) ?? null,
    prioridade: r.prioridade,
  }));

  // Each reserve's balance is spread across the obligations linked to it —
  // commitments and the open card invoice — in proportion to what each one
  // should have accumulated by today (valor ÷ 30 per day since the previous
  // due date). An aporte into the reserve immediately raises each share, up
  // to that daily-rhythm target.
  type CompromissoRow = NonNullable<typeof compromissosRows>[number];
  const reservaSaldo = new Map(reservas.map((r) => [r.id, r.valorAtual]));
  const hoje = todayISODate();
  const fimMes = monthBounds(hoje.slice(0, 7)).end;

  const pendenteDe = (r: CompromissoRow) =>
    Math.max(
      0,
      (r.valor_efetivo_centavos ?? r.valor_previsto_centavos) - (r.valor_pago_centavos ?? 0),
    );
  // Each bill accrues its daily rate (valor ÷ 30) per day elapsed in the
  // current cycle — i.e. since the day after the previous due date. A bill
  // due on the 6th has accrued 3 daily installments on the 9th.
  const acumuladoCompromisso = (r: CompromissoRow): Cents => {
    const total = r.valor_efetivo_centavos ?? r.valor_previsto_centavos;
    return Math.min(pendenteDe(r), acumuladoCiclo(total, r.vencimento ?? fimMes, hoje));
  };

  interface Obrigacao {
    key: string;
    alvo: Cents;
  }
  const porReserva = new Map<string, Obrigacao[]>();
  const addObrigacao = (reservaId: string | null, o: Obrigacao) => {
    if (reservaId == null || o.alvo <= 0) return;
    const list = porReserva.get(reservaId) ?? [];
    list.push(o);
    porReserva.set(reservaId, list);
  };
  for (const row of compromissosRows ?? []) {
    if (row.status === "PAGO") continue;
    addObrigacao(row.reserva_id, { key: `comp:${row.id}`, alvo: acumuladoCompromisso(row) });
  }

  const reservadoPorObrigacao = new Map<string, Cents>();
  // Whatever a linked reserve holds beyond the accrued targets stays
  // unallocated — it is money saved ahead of the daily rhythm.
  let adiantadoFixas = 0;
  for (const [reservaId, rows] of porReserva) {
    const saldo = reservaSaldo.get(reservaId) ?? 0;
    if (saldo <= 0) continue;
    const totalAlvo = rows.reduce((acc, o) => acc + o.alvo, 0);
    if (totalAlvo <= 0) continue;
    // The reserve covers what should have accrued so far; when it falls
    // short the balance splits proportionally to each obligation's share.
    const escala = Math.min(1, saldo / totalAlvo);
    let restante = saldo;
    rows.forEach((o, i) => {
      const share =
        i === rows.length - 1
          ? Math.min(o.alvo, restante)
          : Math.min(o.alvo, Math.floor(o.alvo * escala));
      restante -= share;
      reservadoPorObrigacao.set(o.key, share);
    });
    adiantadoFixas += Math.max(0, restante);
  }

  const compromissos: Compromisso[] = (compromissosRows ?? []).map((c) => {
    const base: Compromisso = {
      id: c.id,
      nome: c.nome,
      valorPrevisto: c.valor_previsto_centavos,
      valorEfetivo: c.valor_efetivo_centavos ?? undefined,
      valorReservado: reservadoPorObrigacao.get(`comp:${c.id}`) ?? 0,
      valorPago: c.valor_pago_centavos ?? 0,
      // Monthly bills without a concrete due date are paid at month-end —
      // a null vencimento must never read as an already-past date.
      vencimento: c.vencimento ?? fimMes,
      prioridade: c.prioridade,
      status: c.status,
    };
    return { ...base, status: derivarStatus(base, hoje) };
  });

  // The consolidated balance comes straight from the derived view; pass an
  // empty movements list so we don't double-count them on top of saldo_atual.
  const posicao = posicaoFinanceira(contas, [], reservas);

  const movimentosReserva: MovimentoReserva[] = (movReservaRows ?? []).map((m) => ({
    id: m.id,
    tipo: m.tipo,
    valor: m.valor_centavos,
    dataReferencia: m.data_referencia,
    descricao: m.descricao,
    reservaNome: (m.reservas_financeiras as { nome?: string } | null)?.nome ?? "Reserva",
  }));

  const transferencias: Transferencia[] = (transferenciasRows ?? []).map((t) => ({
    id: t.id,
    valor: t.valor_centavos,
    dataReferencia: t.data_referencia,
    descricao: t.descricao,
    origemNome: (t.origem as { nome?: string } | null)?.nome ?? "Conta",
    destinoNome: (t.destino as { nome?: string } | null)?.nome ?? "Conta",
  }));

  const pagamentos: Pagamento[] = (pagamentosRows ?? []).map((p) => ({
    id: p.id,
    natureza: p.natureza,
    valor: p.valor_centavos,
    dataReferencia: p.data_referencia,
    descricao: p.descricao,
    contaNome: (p.contas_financeiras as { nome?: string } | null)?.nome ?? "Conta",
    compromissoNome: (p.compromissos_financeiros as { nome?: string } | null)?.nome ?? null,
    transferenciaId: p.transferencia_id,
  }));

  return {
    posicao,
    contas,
    reservas,
    compromissos,
    movimentosReserva,
    transferencias,
    pagamentos,
    adiantadoFixas,
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
  /** Today's net profit (entradas − saídas), in cents. */
  lucroDia: Cents;
  /** Today's provision already ran — no second aporte today. */
  jaGuardouHoje: boolean;
  /** Total already provisioned today into the fixed-bill reserves, in cents. */
  guardadoHoje: Cents;
  diasAteFatura: number;
  diasAteCompromissos: number;
  reservaCartaoId: string | null;
  reservaCompromissosId: string | null;
  resultado: ProvisaoResult;
}

/**
 * Computes the daily provision: each bucket (card invoice; other monthly
 * bills) needs falta ÷ diasRestantes, capped by the day's profit. The card
 * bucket is funded first because its deadline is nearest.
 */
export const getProvisaoDiaria = async (
  painelParam?: PainelFinanceiro | null,
): Promise<ProvisaoPainel | null> => {
  const painel = painelParam === undefined ? await getPainelFinanceiro() : painelParam;
  if (!painel) return null;

  const supabase = await createSupabaseClient();
  const estabelecimentoId = await getEstabelecimentoId();
  if (!estabelecimentoId) return null;

  const hoje = todayISODate();

  // The card bucket is the reserve named "Fatura do cartão" and the
  // compromissos linked to it; everything else goes to the bills bucket.
  const reservaCartao = painel.reservas.find((r) => /cart/i.test(r.nome));
  const [{ data: compromissoLinks }, { data: resumoHoje }, { data: aportesHoje }] =
    await Promise.all([
      supabase
        .from("compromissos_financeiros")
        .select("id, reserva_id")
        .eq("estabelecimento_id", estabelecimentoId)
        .is("deleted_at", null),
      // Same "Livre de Verdade" the Caixa de Hoje tab shows:
      // faturamento × margem bruta − custo fixo diário, in reais.
      supabase
        .from("view_resumo_diario")
        .select("lucro_liquido_dia")
        .eq("data_referencia", hoje)
        .maybeSingle(),
      supabase
        .from("movimentacoes_reservas")
        .select("reserva_id, valor_centavos")
        .eq("estabelecimento_id", estabelecimentoId)
        .eq("tipo", "APORTE")
        .eq("data_referencia", hoje),
    ]);

  const reservaById = new Map(painel.reservas.map((r) => [r.id, r]));
  const cartaoCompromissoIds = new Set(
    (compromissoLinks ?? [])
      .filter((c) => c.reserva_id != null && c.reserva_id === reservaCartao?.id)
      .map((c) => c.id),
  );
  const reservaCompromissosIds = new Set(
    (compromissoLinks ?? [])
      .map((c) => c.reserva_id)
      .filter((id): id is string => id != null && id !== reservaCartao?.id),
  );
  const reservadoCompromissos = [...reservaCompromissosIds].reduce(
    (acc, id) => acc + (reservaById.get(id)?.valorAtual ?? 0),
    0,
  );

  // Today's net profit drives the suggestion — the whole "Livre de Verdade"
  // (margin-adjusted, fixed costs already deducted) is offered once per day,
  // so any aporte into the fixed-bill reserves locks the button until tomorrow.
  const lucroDia = Math.round((resumoHoje?.lucro_liquido_dia ?? 0) * 100);
  const reservasFixasIds = new Set<string>([
    ...reservaCompromissosIds,
    ...(reservaCartao ? [reservaCartao.id] : []),
  ]);
  const aportesFixasHoje = (aportesHoje ?? []).filter(
    (m) => m.reserva_id != null && reservasFixasIds.has(m.reserva_id),
  );
  const jaGuardouHoje = aportesFixasHoje.length > 0;
  const guardadoHoje = aportesFixasHoje.reduce((acc, m) => acc + (m.valor_centavos ?? 0), 0);

  // The card bill is a monthly compromisso like the others: previsto is the
  // reference amount and efetivo carries this cycle's real invoice once set.
  const esperadoCartao = painel.compromissos
    .filter((c) => c.status !== "PAGO" && cartaoCompromissoIds.has(c.id))
    .reduce((acc, c) => acc + (c.valorEfetivo ?? c.valorPrevisto), 0);
  const reservadoCartao = reservaCartao?.valorAtual ?? 0;
  const faltaCartao = Math.max(0, esperadoCartao - reservadoCartao);

  const totalCompromissos = painel.compromissos
    .filter((c) => c.status !== "PAGO" && !cartaoCompromissoIds.has(c.id))
    .reduce((acc, c) => acc + (c.valorEfetivo ?? c.valorPrevisto), 0);
  const faltaCompromissos = Math.max(0, totalCompromissos - reservadoCompromissos);

  // Both buckets provision valor ÷ 30 per day — a flat 30-day cycle per
  // monthly obligation, regardless of its due date inside the month.
  const diasAteFatura = 30;
  const diasAteCompromissos = 30;

  const resultado = provisaoDiaria({
    faltaCartao,
    diasAteFatura,
    faltaCompromissos,
    diasAteCompromissos,
    lucroDia,
    jaGuardouHoje,
    saldoLivre: painel.posicao.saldoLivre,
  });

  return {
    esperadoCartao,
    reservadoCartao,
    faltaCartao,
    totalCompromissos,
    reservadoCompromissos,
    faltaCompromissos,
    saldoLivre: painel.posicao.saldoLivre,
    lucroDia,
    jaGuardouHoje,
    guardadoHoje,
    diasAteFatura,
    diasAteCompromissos,
    reservaCartaoId: reservaCartao?.id ?? null,
    reservaCompromissosId:
      reservaCompromissosIds.size === 1 ? [...reservaCompromissosIds][0] : null,
    resultado,
  };
};
