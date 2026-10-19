import { Menu, Bell } from 'lucide-react';

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const getFormattedDate = (): { weekday: string; dayMonth: string } => {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  return {
    weekday: `${weekday}, ${day} de ${month}`,
    dayMonth: `${day}/${month.slice(0, 3)}`,
  };
};

interface GreetingHeaderProps {
  onOpenRetroactive?: () => void;
}

export const GreetingHeader = ({ onOpenRetroactive }: GreetingHeaderProps) => {
  const { weekday } = getFormattedDate();

  return (
    <header className='rounded-b-[2.5rem] bg-white px-6 pb-5 pt-8 shadow-sm relative z-10'>
      <div className='mb-4 flex items-center justify-between'>
        <button
          type='button'
          aria-label='Menu Principal'
          className='flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100'
        >
          <Menu className='h-6 w-6' />
        </button>
        <span className='inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700'>
          Mercado Amigo
        </span>
        <button
          type='button'
          aria-label='Notificações'
          className='relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100'
        >
          <Bell className='h-6 w-6' />
          <span className='absolute right-2.5 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white' />
        </button>
      </div>

      <div className='mt-2 text-left'>
        <h1 className='text-2xl font-extrabold leading-tight tracking-tight text-slate-800'>
          Olá, Pai &amp; Mãe! 👋
        </h1>
        <p className='mt-0.5 text-sm font-semibold text-indigo-600'>
          {weekday}
        </p>
        <p className='mt-1 text-xs text-slate-500'>
          Bora fechar o caixinha de hoje de forma rápida e tranquila?
        </p>

        <div className='mt-3 flex items-center justify-between border-t border-slate-100 pt-2'>
          <button
            type='button'
            onClick={onOpenRetroactive}
            className='inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-colors hover:bg-amber-100'
          >
            <span>📅</span>
            <span>Esqueceu de anotar algum dia?</span>
            <span className='ml-0.5 font-extrabold text-amber-900 underline'>
              Lançar data anterior
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
