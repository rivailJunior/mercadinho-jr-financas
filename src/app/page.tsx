import {
  BottomNav,
  FechamentoCaixaForm,
  WeeklyChart,
  WhatsAppHelpLink,
  YearlyChart,
  YearlySummaryCard,
} from "@/components";
import {
  getTodayTotals,
  getWeeklyData,
  getYearlyData,
  getYearlyTotals,
} from "@/lib/cash-closing-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [weeklyData, yearlyData, today, yearly] = await Promise.all([
    getWeeklyData(),
    getYearlyData(),
    getTodayTotals(),
    getYearlyTotals(),
  ]);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-app-bg pb-24 shadow-2xl">
      <FechamentoCaixaForm initialEntrada={today.entrada} initialSaida={today.saida} />

      <div className="flex-1 space-y-6 px-5 pt-6 pb-6">
        <YearlySummaryCard summary={{ totalEntradas: yearly.entrada, totalSaidas: yearly.saida }} />
        <WeeklyChart data={weeklyData} />
        <YearlyChart data={yearlyData} />

        <WhatsAppHelpLink />
      </div>

      <BottomNav />
    </main>
  );
}
