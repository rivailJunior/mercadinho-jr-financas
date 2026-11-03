import { formatCurrency } from "@/lib/formatCurrency";
import type { LucideIcon } from "lucide-react";

interface SummaryCardItemProps {
  label: string;
  value: number;
  subtitle: string;
  bgColor: string;
  labelColor: string;
  subtitleColor: string;
  barColor: string;
  shadowClass: string;
  icon?: LucideIcon;
}

export const SummaryCardItem = ({
  label,
  value,
  subtitle,
  bgColor,
  labelColor,
  subtitleColor,
  barColor,
  shadowClass,
  icon: Icon,
}: SummaryCardItemProps) => (
  <article
    className={`${bgColor} ${shadowClass} flex h-26 flex-col justify-between rounded-3xl p-4 text-white`}
  >
    {Icon ? (
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
    ) : (
      <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
    )}
    <div>
      <p className="tabular-nums text-lg font-black leading-none tracking-tight">
        {formatCurrency(value)}
      </p>
      <span className={`mt-1 block text-[11px] ${subtitleColor}`}>{subtitle}</span>
    </div>
  </article>
);
