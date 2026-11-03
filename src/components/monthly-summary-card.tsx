import { SummaryCardItem } from "@/components/summary-card-item";
import type { MonthlyReportSummary } from "@/types/cashClosing";
import { PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface MonthlySummaryCardProps {
  summary: MonthlyReportSummary;
}

export const MonthlySummaryCard = ({ summary }: MonthlySummaryCardProps) => {
  return (
    <section aria-labelledby="monthly-summary-title">
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="monthly-summary-title"
          className="text-sm font-bold uppercase tracking-wider text-slate-500"
        >
          Resumo do Mês
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <SummaryCardItem
          label="Entrou Bruto"
          value={summary.totalEntradas}
          subtitle="Total apurado no mês"
          bgColor="bg-brand-blue"
          labelColor="text-blue-100"
          subtitleColor="text-blue-200"
          barColor="bg-blue-300/40"
          shadowClass="shadow-card-blue"
          icon={TrendingUp}
        />
        <SummaryCardItem
          label="Saiu no Balcão"
          value={summary.totalSaidas}
          subtitle="Despesas e compras"
          bgColor="bg-brand-coral"
          labelColor="text-rose-100"
          subtitleColor="text-rose-200"
          barColor="bg-rose-300/40"
          shadowClass="shadow-card-coral"
          icon={TrendingDown}
        />
        <SummaryCardItem
          label="Guardar p/ Contas"
          value={summary.totalReserva}
          subtitle="Reserva mensal fixa"
          bgColor="bg-brand-mint"
          labelColor="text-emerald-100"
          subtitleColor="text-emerald-100"
          barColor="bg-emerald-300/40"
          shadowClass="shadow-card-mint"
          icon={PiggyBank}
        />
        <SummaryCardItem
          label="Livre de Verdade"
          value={summary.livreDeVerdade}
          subtitle="Lucro líquido real"
          bgColor="bg-brand-deep-purple"
          labelColor="text-indigo-100"
          subtitleColor="text-indigo-200"
          barColor="bg-indigo-300/40"
          shadowClass="shadow-card-purple"
          icon={Wallet}
        />
      </div>
    </section>
  );
};
