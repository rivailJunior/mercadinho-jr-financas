import { formatCurrency } from '@/lib/formatCurrency';
import { FIXED_EXPENSES, TOTAL_RESERVA_DIARIA } from '@/constants/cashClosing';

const DOT_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-purple-500',
  'bg-cyan-500',
];

export const FixedExpenseReserve = () => {
  return (
    <section
      className='rounded-3xl border border-slate-100 bg-white p-5 shadow-soft'
      aria-labelledby='fixed-reserve-title'
    >
      <div className='mb-3 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-lg font-bold text-amber-700'>
          🛡️
        </div>
        <div>
          <h3
            id='fixed-reserve-title'
            className='text-sm font-extrabold leading-snug text-slate-800'
          >
            Reserva Diária das Contas Fixas
          </h3>
          <p className='text-xs text-slate-500'>
            Guardando todo dia, no final do mês não falta nada!
          </p>
        </div>
      </div>

      <div className='space-y-2.5 border-t border-slate-100 pt-2'>
        {FIXED_EXPENSES.map((expense, index) => (
          <div
            key={expense.nome}
            className='flex items-center justify-between py-1 text-xs'
          >
            <div className='flex items-center gap-2'>
              <span
                className={`h-2 w-2 rounded-full ${DOT_COLORS[index % DOT_COLORS.length]}`}
              />
              <span className='font-medium text-slate-600'>
                {expense.nome}:
              </span>
            </div>
            <span className='tabular-nums font-bold text-slate-800'>
              {formatCurrency(expense.reservaDiaria)}/dia
            </span>
          </div>
        ))}
      </div>

      <div className='mt-4 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-3'>
        <div>
          <span className='block text-[11px] font-bold uppercase tracking-wider text-emerald-800'>
            Guardar hoje na caixinha:
          </span>
          <span className='tabular-nums text-xl font-black text-emerald-700'>
            {formatCurrency(TOTAL_RESERVA_DIARIA)}
          </span>
        </div>
        <span className='rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm'>
          Dia Pago! ✅
        </span>
      </div>
    </section>
  );
};
