import {
  DIAS_SEMANA,
  DIAS_SEMANA_ABREV,
  MESES,
  MESES_ABREV,
  daysAgoISODate,
  todayISODate,
  weekdayIndexFromISODate,
} from "@/lib/dates";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { WeeklyDay, YearlyMonth } from "@/types/cashClosing";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Daily entradas/saídas for the last 7 days, ending today. */
export const getWeeklyData = async (): Promise<WeeklyDay[]> => {
  const supabase = await createSupabaseClient();
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
  const supabase = await createSupabaseClient();
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

/** Aggregated entradas/saídas for the current year. */
export const getYearlyTotals = async () => {
  const supabase = await createSupabaseClient();
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
  const supabase = await createSupabaseClient();
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
