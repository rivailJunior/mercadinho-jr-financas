"use client";

import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import type { DailySummary } from "@/types/cashClosing";

interface SummaryItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "positive" | "negative" | "neutral" | "highlight";
}

const VARIANT_STYLES = {
  positive: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: "text-green-700",
  },
  negative: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-700",
  },
  neutral: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "text-amber-700",
  },
  highlight: {
    bg: "bg-green-50",
    text: "text-primary",
    icon: "text-primary",
  },
} as const;

const SummaryItem = ({ label, value, icon, variant }: SummaryItemProps) => {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-(--space-sm)">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-(--rounded-md)",
            styles.bg,
          )}
        >
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        </div>
        <span className="text-[14px] font-medium leading-5 text-slate-700">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "tabular-nums text-[20px] font-bold leading-7",
          styles.text,
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
};

interface DailySummaryCardProps {
  summary: DailySummary;
}

export const DailySummaryCard = ({ summary }: DailySummaryCardProps) => {
  return (
    <section
      className={cn(
        "rounded-(--rounded-lg) border border-slate-200 bg-white",
        "p-(--space-md) flex flex-col",
      )}
      aria-labelledby="daily-summary-title"
    >
      <h2
        id="daily-summary-title"
        className="mb-(--space-sm) text-[18px] font-semibold leading-6.5 text-slate-900"
      >
        Resumo de Hoje
      </h2>

      <div className="divide-y divide-slate-100">
        <SummaryItem
          label="Entradas"
          value={summary.totalEntradas}
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          variant="positive"
        />
        <SummaryItem
          label="Saídas"
          value={summary.totalSaidas}
          icon={<TrendingDown className="h-4.5 w-4.5" />}
          variant="negative"
        />
        <SummaryItem
          label="Reserva Diária"
          value={summary.reservaDiaria}
          icon={<PiggyBank className="h-4.5 w-4.5" />}
          variant="neutral"
        />
      </div>

      <div
        className={cn(
          "mt-(--space-sm) flex items-center justify-between",
          "rounded-(--rounded-md) bg-green-50 px-4 py-3",
        )}
      >
        <div className="flex items-center gap-(--space-sm)">
          <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-[14px] font-semibold leading-5 text-primary">
            Sobra Limpa
          </span>
        </div>
        <span className="tabular-nums text-[28px] font-bold leading-8.5 tracking-[-0.02em] text-primary">
          {formatCurrency(summary.sobraLimpa)}
        </span>
      </div>
    </section>
  );
};
