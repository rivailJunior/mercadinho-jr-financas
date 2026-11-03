"use client";

import { CalendarPopup } from "@/components/calendar-popup";
import { formatMonthLabel, formatShortISODate, shiftMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { LancamentoFilter } from "@/types/cashClosing";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, List, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface FilterCounts {
  total: number;
  entradas: number;
  saidas: number;
}

interface MonthFilterCardProps {
  /** YYYY-MM */
  mesAtual: string;
  /** Selected YYYY-MM-DD date, if any. */
  diaSelecionado?: string;
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
  diaSelecionado,
  filter,
  counts,
  onFilterChange,
}: MonthFilterCardProps) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <section
      aria-label="Filtros do relatório"
      className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-3.5 shadow-sm"
    >
      <div className="relative flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
        <Link
          href={`/relatorio?mes=${shiftMonth(mesAtual, -1)}`}
          aria-label="Mês anterior"
          className={navButtonClass}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-expanded={calendarOpen}
          aria-haspopup="dialog"
          onClick={() => setCalendarOpen((open) => !open)}
          className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-slate-100"
        >
          <Calendar className="h-5 w-5 fill-indigo-100 text-indigo-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-800">{formatMonthLabel(mesAtual)}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform",
              calendarOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        <Link
          href={`/relatorio?mes=${shiftMonth(mesAtual, 1)}`}
          aria-label="Próximo mês"
          className={navButtonClass}
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Link>

        {calendarOpen && (
          <CalendarPopup
            mesAtual={mesAtual}
            diaSelecionado={diaSelecionado}
            onClose={() => setCalendarOpen(false)}
          />
        )}
      </div>

      {diaSelecionado && (
        <div className="flex justify-center">
          <Link
            href={`/relatorio?mes=${mesAtual}`}
            className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
          >
            Dia: {formatShortISODate(diaSelecionado)}
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Limpar filtro de data</span>
          </Link>
        </div>
      )}

      <div
        className="flex md:flex-row flex-col items-center gap-1.5 overflow-x-auto pb-0.5"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => onFilterChange("all")}
          className={cn(pillClass(filter === "all"), "w-full md:flex-1")}
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Todos ({counts.total})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "ENTRADA"}
          onClick={() => onFilterChange("ENTRADA")}
          className={cn(pillClass(filter === "ENTRADA"), "w-full md:flex-1")}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Entradas (+{counts.entradas})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "SAIDA"}
          onClick={() => onFilterChange("SAIDA")}
          className={cn(pillClass(filter === "SAIDA"), "w-full md:flex-1")}
        >
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Saídas (-{counts.saidas})
        </button>
      </div>
    </section>
  );
};
