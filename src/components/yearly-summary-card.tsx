import { SummaryCardItem } from "@/components/summary-card-item";
import type { YearlySummary } from "@/types/cashClosing";

interface YearlySummaryCardProps {
  summary: YearlySummary;
}

export const YearlySummaryCard = ({ summary }: YearlySummaryCardProps) => {
  return (
    <section aria-labelledby="yearly-summary-title">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="yearly-summary-title"
          className="text-sm font-bold uppercase tracking-wider text-slate-500"
        >
          Resumo do Ano
        </h2>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">
          {new Date().getFullYear()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <SummaryCardItem
          label="Entrou no Ano"
          value={summary.totalEntradas}
          subtitle="Total de entradas"
          bgColor="bg-brand-blue"
          labelColor="text-blue-100"
          subtitleColor="text-blue-200"
          barColor="bg-blue-300/40"
          shadowClass="shadow-card-blue"
        />
        <SummaryCardItem
          label="Saiu no Ano"
          value={summary.totalSaidas}
          subtitle="Total de saídas"
          bgColor="bg-brand-coral"
          labelColor="text-rose-100"
          subtitleColor="text-rose-200"
          barColor="bg-rose-300/40"
          shadowClass="shadow-card-coral"
        />
      </div>
    </section>
  );
};
