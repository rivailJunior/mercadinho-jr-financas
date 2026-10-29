import { formatCurrency } from "@/lib/formatCurrency";

interface SummaryCardItemProps {
  label: string;
  value: number;
  subtitle: string;
  bgColor: string;
  labelColor: string;
  subtitleColor: string;
  barColor: string;
  shadowClass: string;
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
}: SummaryCardItemProps) => (
  <article
    className={`${bgColor} ${shadowClass} flex h-36 flex-col justify-between rounded-3xl p-4 text-white`}
  >
    <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
    <div>
      <p className="tabular-nums text-2xl font-black leading-none tracking-tight">
        {formatCurrency(value)}
      </p>
      <span className={`mt-1 block text-[11px] ${subtitleColor}`}>{subtitle}</span>
    </div>
    <div className={`h-1.5 w-7 rounded-full ${barColor}`} />
  </article>
);
