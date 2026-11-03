import { BottomNav, GreetingHeader, RelatorioScreen } from "@/components";
import { currentMonthKey, isValidMonthKey } from "@/lib/dates";
import { getMonthlyReport } from "@/lib/report-data";

export const dynamic = "force-dynamic";

interface RelatorioPageProps {
  searchParams: Promise<{ mes?: string }>;
}

export default async function RelatorioPage({ searchParams }: RelatorioPageProps) {
  const { mes } = await searchParams;
  const mesAtual = mes && isValidMonthKey(mes) ? mes : currentMonthKey();
  const report = await getMonthlyReport(mesAtual);

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-app-bg pb-24 shadow-2xl">
      <GreetingHeader />

      <div className="flex-1 space-y-6 px-5 pt-5 pb-6">
        <RelatorioScreen report={report} />
      </div>

      <BottomNav active="relatorio" />
    </main>
  );
}
