import { formatCurrency } from '@/lib/formatCurrency';
import { WEEKLY_DATA } from '@/constants/cashClosing';

const AVERAGE = Math.round(
  WEEKLY_DATA.reduce((acc, d) => acc + d.valor, 0) / WEEKLY_DATA.length,
);

export const WeeklyChart = () => {
  return (
    <section
      className='rounded-3xl border border-slate-100 bg-white p-5 shadow-soft'
      aria-labelledby='weekly-chart-title'
    >
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h4
            id='weekly-chart-title'
            className='text-xs font-bold uppercase tracking-wide text-slate-700'
          >
            Como foi sua semana
          </h4>
          <p className='text-xs text-slate-400'>Movimento dos últimos 7 dias</p>
        </div>
        <span className='tabular-nums text-xs font-black text-indigo-600'>
          Média: {formatCurrency(AVERAGE)}
        </span>
      </div>

      <div className='relative pb-1 pt-2'>
        <svg
          className='h-24 w-full overflow-visible'
          fill='none'
          viewBox='0 0 340 100'
          aria-label='Gráfico de curva do movimento semanal'
          role='img'
        >
          <defs>
            <linearGradient id='curveGradient' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#5b72ff' stopOpacity='0.25' />
              <stop offset='100%' stopColor='#5b72ff' stopOpacity='0.0' />
            </linearGradient>
          </defs>
          <path
            d='M 0,80 C 40,75 70,50 110,60 C 150,70 180,35 220,40 C 260,45 290,20 340,30 L 340,100 L 0,100 Z'
            fill='url(#curveGradient)'
          />
          <path
            d='M 0,80 C 40,75 70,50 110,60 C 150,70 180,35 220,40 C 260,20 290,20 340,30'
            stroke='#5b72ff'
            strokeLinecap='round'
            strokeWidth='3.5'
          />
          <circle
            cx='280'
            cy='22'
            r='6'
            className='fill-white stroke-indigo-600 stroke-3'
          />
          <circle cx='280' cy='22' r='2.5' className='fill-indigo-600' />
          <g transform='translate(255, -2)'>
            <rect width='52' height='18' rx='9' fill='#1e293b' />
            <text
              x='26'
              y='13'
              textAnchor='middle'
              fill='#ffffff'
              fontSize='10'
              fontWeight='bold'
            >
              R$ 3.250
            </text>
          </g>
        </svg>

        <div className='mt-2 flex justify-between px-1 text-[11px] font-bold text-slate-400'>
          {WEEKLY_DATA.map((day, i) => (
            <span
              key={day.diaAbreviado}
              className={
                i === WEEKLY_DATA.length - 4
                  ? 'font-extrabold text-indigo-600'
                  : ''
              }
            >
              {i === WEEKLY_DATA.length - 4 ? 'Hoje' : day.diaAbreviado}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
