import { formatCurrency } from '@/lib/formatCurrency';
import type { DailySummary } from '@/types/cashClosing';

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

const SummaryCardItem = ({
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
      <p className='tabular-nums text-2xl font-black leading-none tracking-tight'>
        {formatCurrency(value)}
      </p>
      <span className={`mt-1 block text-[11px] ${subtitleColor}`}>
        {subtitle}
      </span>
    </div>
    <div className={`h-1.5 w-7 rounded-full ${barColor}`} />
  </article>
);

interface DailySummaryCardProps {
  summary: DailySummary;
}

export const DailySummaryCard = ({ summary }: DailySummaryCardProps) => {
  return (
    <section aria-labelledby='daily-summary-title'>
      <div className='mb-3 flex items-center justify-between'>
        <h2
          id='daily-summary-title'
          className='text-sm font-bold uppercase tracking-wider text-slate-500'
        >
          Resumo de Hoje
        </h2>
        <span className='rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600'>
          Tudo Equilibrado ✨
        </span>
      </div>

      <div className='grid grid-cols-2 gap-3.5'>
        <SummaryCardItem
          label='Entrou Bruto'
          value={summary.totalEntradas}
          subtitle='Total apurado hoje'
          bgColor='bg-brand-blue'
          labelColor='text-blue-100'
          subtitleColor='text-blue-200'
          barColor='bg-blue-300/40'
          shadowClass='shadow-card-blue'
        />
        <SummaryCardItem
          label='Saiu no Balcão'
          value={summary.totalSaidas}
          subtitle='Compras de reposição'
          bgColor='bg-brand-coral'
          labelColor='text-rose-100'
          subtitleColor='text-rose-200'
          barColor='bg-rose-300/40'
          shadowClass='shadow-card-coral'
        />
        <SummaryCardItem
          label='Guardar p/ Contas'
          value={summary.reservaDiaria}
          subtitle='Separar na gaveta'
          bgColor='bg-brand-mint'
          labelColor='text-emerald-100'
          subtitleColor='text-emerald-100'
          barColor='bg-emerald-300/40'
          shadowClass='shadow-card-mint'
        />
        <SummaryCardItem
          label='Livre de Verdade'
          value={summary.sobraLimpa}
          subtitle='Lucro limpo do dia'
          bgColor='bg-brand-deep-purple'
          labelColor='text-indigo-100'
          subtitleColor='text-indigo-200'
          barColor='bg-indigo-300/40'
          shadowClass='shadow-card-purple'
        />
      </div>
    </section>
  );
};
