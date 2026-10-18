import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import { WEEKLY_DATA } from "@/constants/cashClosing";

export const WeeklyChart = () => {
  const maxValue = Math.max(...WEEKLY_DATA.map((d) => d.valor));

  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col gap-(--space-md)",
      )}
      aria-labelledby="weekly-chart-title"
    >
      <div className="flex items-center gap-(--space-sm)">
        <div className="flex h-10 w-10 items-center justify-center rounded-(--rounded-md) bg-blue-100">
          <BarChart3 className="h-5 w-5 text-blue-700" aria-hidden="true" />
        </div>
        <div>
          <h2
            id="weekly-chart-title"
            className="text-[18px] font-semibold leading-6.5 text-slate-900"
          >
            Como foi sua semana
          </h2>
          <p className="text-[14px] leading-5 text-slate-500">
            Movimento dos últimos 7 dias
          </p>
        </div>
      </div>

      <div
        className="flex items-end justify-between gap-(--space-xs) px-(--space-xs)"
        role="img"
        aria-label="Gráfico de barras do movimento semanal"
      >
        {WEEKLY_DATA.map((day) => {
          const heightPercent = (day.valor / maxValue) * 100;
          const isToday = day.diaAbreviado === "Qui";

          return (
            <div
              key={day.diaAbreviado}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "tabular-nums text-[11px] font-bold leading-3.5",
                  isToday ? "text-primary" : "text-slate-500",
                )}
              >
                {formatCurrency(day.valor)}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-(--rounded-sm) transition-all",
                  isToday
                    ? "bg-primary"
                    : "bg-slate-200",
                )}
                style={{ height: `${Math.max(heightPercent * 1.2, 8)}px` }}
                role="presentation"
              />
              <span
                className={cn(
                  "text-[11px] font-semibold leading-3.5 tracking-[0.04em]",
                  isToday ? "text-primary" : "text-slate-500",
                )}
              >
                {day.diaAbreviado}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
