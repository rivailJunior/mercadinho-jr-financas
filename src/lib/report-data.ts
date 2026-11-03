import { monthBounds } from "@/lib/dates";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Lancamento, MonthlyReport } from "@/types/cashClosing";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Lançamentos and aggregated totals for a given month key (YYYY-MM). */
export const getMonthlyReport = async (mes: string): Promise<MonthlyReport> => {
  const supabase = createSupabaseClient();
  const { start, end } = monthBounds(mes);

  const [{ data: lancamentos }, { data: resumo }] = await Promise.all([
    supabase
      .from("lancamentos_caixa")
      .select("id, tipo, valor, descricao, data_referencia")
      .gte("data_referencia", start)
      .lte("data_referencia", end)
      .order("data_referencia", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("view_resumo_diario")
      .select("faturamento_dia, saidas_registradas_dia, custos_fixos_dia, lucro_liquido_dia")
      .gte("data_referencia", start)
      .lte("data_referencia", end),
  ]);

  let totalEntradas = 0;
  let totalSaidas = 0;
  let totalReserva = 0;
  let livreDeVerdade = 0;
  for (const row of resumo ?? []) {
    totalEntradas += row.faturamento_dia ?? 0;
    totalSaidas += row.saidas_registradas_dia ?? 0;
    totalReserva += row.custos_fixos_dia ?? 0;
    livreDeVerdade += row.lucro_liquido_dia ?? 0;
  }

  const items: Lancamento[] = (lancamentos ?? []).map((l) => ({
    id: l.id,
    tipo: l.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA",
    descricao:
      l.descricao?.trim() || (l.tipo === "ENTRADA" ? "Entrada no caixa" : "Saída no caixa"),
    valor: l.valor,
    dataReferencia: l.data_referencia,
  }));

  return {
    mes,
    summary: {
      totalEntradas: round2(totalEntradas),
      totalSaidas: round2(totalSaidas),
      totalReserva: round2(totalReserva),
      livreDeVerdade: round2(livreDeVerdade),
    },
    lancamentos: items,
  };
};
