import { daysAgoISODate, todayISODate, weekdayIndexFromISODate } from "@/lib/dates";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { FixedExpense, WeeklyDay, YearlyMonth } from "@/types/cashClosing";

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;

const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Daily entradas/saídas for the last 7 days, ending today. */
export const getWeeklyData = async (): Promise<WeeklyDay[]> => {
  const supabase = createSupabaseClient();
  const days = Array.from({ length: 7 }, (_, i) => daysAgoISODate(6 - i));

  const { data } = await supabase
    .from("view_resumo_diario")
    .select("data_referencia, faturamento_dia, saidas_registradas_dia")
    .gte("data_referencia", days[0])
    .lte("data_referencia", days[6]);

  const byDate = new Map((data ?? []).map((r) => [r.data_referencia, r]));

  return days.map((isoDate) => {
    const row = byDate.get(isoDate);
    const weekday = weekdayIndexFromISODate(isoDate);
    return {
      dia: DIAS_SEMANA[weekday],
      diaAbreviado: DIAS_SEMANA_ABREV[weekday],
      valor: row?.faturamento_dia ?? 0,
      saida: row?.saidas_registradas_dia ?? 0,
    };
  });
};

/** Monthly entradas/saídas for the current year, January through the current month. */
export const getYearlyData = async (): Promise<YearlyMonth[]> => {
  const supabase = createSupabaseClient();
  const today = todayISODate();
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const currentMonth = Number(today.slice(5, 7));

  const { data } = await supabase
    .from("view_resumo_diario")
    .select("data_referencia, faturamento_dia, saidas_registradas_dia")
    .gte("data_referencia", yearStart)
    .lte("data_referencia", today);

  const entradaByMonth = new Array<number>(currentMonth).fill(0);
  const saidaByMonth = new Array<number>(currentMonth).fill(0);
  for (const row of data ?? []) {
    if (!row.data_referencia) continue;
    const month = Number(row.data_referencia.slice(5, 7)) - 1;
    if (month < 0 || month >= currentMonth) continue;
    entradaByMonth[month] += row.faturamento_dia ?? 0;
    saidaByMonth[month] += row.saidas_registradas_dia ?? 0;
  }

  return entradaByMonth.map((valor, i) => ({
    dia: MESES[i],
    diaAbreviado: MESES_ABREV[i],
    valor: round2(valor),
    saida: round2(saidaByMonth[i]),
  }));
};

interface FixedExpensesResult {
  expenses: FixedExpense[];
  totalReservaDiaria: number;
}

/**
 * Active fixed costs for the current vigencia, expressed as a daily reserve
 * (valor_mensal / dias úteis, or percentual × média diária de faturamento).
 */
export const getFixedExpenses = async (): Promise<FixedExpensesResult> => {
  const supabase = createSupabaseClient();

  const [{ data: custos }, { data: estabelecimento }] = await Promise.all([
    supabase
      .from("custos_fixos_config")
      .select("nome, tipo_custo, valor_mensal, percentual_sugerido, mes_ano_vigencia")
      .eq("ativo", true),
    supabase
      .from("estabelecimentos")
      .select("dias_uteis_mes_padrao")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const diasUteis = estabelecimento?.dias_uteis_mes_padrao ?? 30;

  // Keep only the latest vigencia that is already in effect.
  const mesAtual = `${todayISODate().slice(0, 7)}-01`;
  const elegiveis = (custos ?? []).filter((c) => c.mes_ano_vigencia <= mesAtual);
  const vigencia = elegiveis.reduce(
    (max, c) => (c.mes_ano_vigencia > max ? c.mes_ano_vigencia : max),
    "",
  );
  const rows = elegiveis.filter((c) => c.mes_ano_vigencia === vigencia);

  // Percentual costs are converted to R$ using the 30-day average revenue.
  let mediaDiaria = 0;
  if (rows.some((c) => c.tipo_custo === "PERCENTUAL_RECEITA")) {
    const { data: resumo } = await supabase
      .from("view_resumo_diario")
      .select("faturamento_dia")
      .gte("data_referencia", daysAgoISODate(30));
    const total = (resumo ?? []).reduce((acc, r) => acc + (r.faturamento_dia ?? 0), 0);
    mediaDiaria = total / 30;
  }

  const expenses: FixedExpense[] = rows.map((c) => ({
    nome: c.nome,
    valorMensal: c.valor_mensal ?? 0,
    reservaDiaria:
      c.tipo_custo === "PERCENTUAL_RECEITA"
        ? round2(((c.percentual_sugerido ?? 0) / 100) * mediaDiaria)
        : round2((c.valor_mensal ?? 0) / diasUteis),
  }));

  return {
    expenses,
    totalReservaDiaria: round2(expenses.reduce((acc, e) => acc + e.reservaDiaria, 0)),
  };
};

/** Aggregated entradas/saídas for the current year. */
export const getYearlyTotals = async () => {
  const supabase = createSupabaseClient();
  const yearStart = `${todayISODate().slice(0, 4)}-01-01`;

  const { data } = await supabase
    .from("view_resumo_diario")
    .select("faturamento_dia, saidas_registradas_dia")
    .gte("data_referencia", yearStart);

  let entrada = 0;
  let saida = 0;
  for (const row of data ?? []) {
    entrada += row.faturamento_dia ?? 0;
    saida += row.saidas_registradas_dia ?? 0;
  }
  return { entrada: round2(entrada), saida: round2(saida) };
};

/** Aggregated entradas/saídas already registered for today. */
export const getTodayTotals = async () => {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("lancamentos_caixa")
    .select("tipo, valor")
    .eq("data_referencia", todayISODate());

  let entrada = 0;
  let saida = 0;
  for (const row of data ?? []) {
    if (row.tipo === "ENTRADA") entrada += row.valor;
    else if (row.tipo === "SAIDA") saida += row.valor;
  }
  return { entrada, saida };
};
