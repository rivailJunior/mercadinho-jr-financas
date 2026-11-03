import { formatMonthLabel, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { LancamentoFilter } from "@/types/cashClosing";
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react";
import Link from "next/link";

interface FilterCounts {
  total: number;
  entradas: number;
  saidas: number;
}

interface MonthFilterCardProps {
  /** YYYY-MM */
  mesAtual: string;
  filter: LancamentoFilter;
  counts: FilterCounts;
  onFilterChange: (filter: LancamentoFilter) => void;
}

const navButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition-all active:scale-95 active:bg-slate-200";

const pillClass = (active: boolean) =>
  cn(
    "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
    active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
  );

export const MonthFilterCard = ({
  mesAtual,
  filter,
  counts,
  onFilterChange,
}: MonthFilterCardProps) => {
  return (
    <section
      aria-label="Filtros do relatório"
      className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-3.5 shadow-sm"
    >
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
        <Link
          href={`/relatorio?mes=${shiftMonth(mesAtual, -1)}`}
          aria-label="Mês anterior"
          className={navButtonClass}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 fill-indigo-100 text-indigo-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-800">{formatMonthLabel(mesAtual)}</span>
        </div>
        <Link
          href={`/relatorio?mes=${shiftMonth(mesAtual, 1)}`}
          aria-label="Próximo mês"
          className={navButtonClass}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => onFilterChange("all")}
          className={pillClass(filter === "all")}
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Todos ({counts.total})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "ENTRADA"}
          onClick={() => onFilterChange("ENTRADA")}
          className={pillClass(filter === "ENTRADA")}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Entradas (+{counts.entradas})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "SAIDA"}
          onClick={() => onFilterChange("SAIDA")}
          className={pillClass(filter === "SAIDA")}
        >
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Saídas (-{counts.saidas})
        </button>
      </div>
    </section>
  );
};
