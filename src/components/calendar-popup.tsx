"use client";

import { DIAS_SEMANA_ABREV, formatMonthLabel, shiftMonth, todayISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface CalendarPopupProps {
  /** YYYY-MM month currently loaded. */
  mesAtual: string;
  /** Selected YYYY-MM-DD date, if any. */
  diaSelecionado?: string;
  onClose: () => void;
}

const popupNavButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 active:scale-95";

export const CalendarPopup = ({ mesAtual, diaSelecionado, onClose }: CalendarPopupProps) => {
  const [viewMonth, setViewMonth] = useState(mesAtual);
  const hoje = useMemo(() => todayISODate(), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [year, month] = viewMonth.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const dayHref = (day: number) => {
    const iso = `${viewMonth}-${String(day).padStart(2, "0")}`;
    return `/relatorio?mes=${viewMonth}&dia=${iso}`;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fechar calendário"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
      />
      <dialog
        open
        aria-label="Selecionar data"
        className="absolute inset-x-0 top-full z-50 m-0 mt-2 flex w-auto flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
            className={popupNavButtonClass}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-sm font-bold text-slate-800">{formatMonthLabel(viewMonth)}</span>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
            className={popupNavButtonClass}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center">
          {DIAS_SEMANA_ABREV.map((dia) => (
            <span key={dia} className="py-1 text-[10px] font-bold uppercase text-slate-400">
              {dia}
            </span>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const iso = `${viewMonth}-${String(day).padStart(2, "0")}`;
            const isSelected = iso === diaSelecionado;
            const isToday = iso === hoje;
            return (
              <Link
                key={iso}
                href={dayHref(day)}
                prefetch={false}
                aria-current={isSelected ? "date" : undefined}
                style={day === 1 ? { gridColumnStart: firstWeekday + 1 } : undefined}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
                  isToday && !isSelected && "ring-1 ring-inset ring-indigo-300",
                )}
              >
                {day}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2">
          <Link
            href={`/relatorio?mes=${viewMonth}`}
            prefetch={false}
            className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Ver mês inteiro
          </Link>
          <Link
            href={`/relatorio?mes=${hoje.slice(0, 7)}&dia=${hoje}`}
            prefetch={false}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Hoje
          </Link>
        </div>
      </dialog>
    </>
  );
};
