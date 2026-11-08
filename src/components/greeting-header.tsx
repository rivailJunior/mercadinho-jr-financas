import { LogoutButton } from "@/components/logout-button";
import { todayISODate, weekdayIndexFromISODate } from "@/lib/dates";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getFormattedDate = (): { weekday: string; dayMonth: string } => {
  const isoDate = todayISODate();
  const [, month, day] = isoDate.split("-").map(Number);
  const weekday = WEEKDAYS[weekdayIndexFromISODate(isoDate)];
  const monthName = MONTHS[month - 1];
  return {
    weekday: `${weekday}, ${day} de ${monthName}`,
    dayMonth: `${day}/${monthName.slice(0, 3)}`,
  };
};

interface GreetingHeaderProps {
  onOpenRetroactive?: () => void;
}

export const GreetingHeader = ({ onOpenRetroactive }: GreetingHeaderProps) => {
  const { weekday } = getFormattedDate();

  return (
    <header className="rounded-b-[2.5rem] bg-white px-6 pb-5 pt-8 shadow-sm relative z-10">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
          Mercadinho Jr
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-indigo-600">
          {weekday}
          <LogoutButton />
        </span>
      </div>

      <div className="mt-2 text-left">
        <p className="mt-1 text-xs text-slate-500">
          Bora fechar o caixa de hoje de forma rápida e tranquila?
        </p>

        {onOpenRetroactive && (
          <div className="mt-3 border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={onOpenRetroactive}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition-colors hover:bg-amber-100"
            >
              <span>📅</span>
              <span>Esqueceu de anotar algum dia?</span>
              <span className="ml-0.5 font-extrabold text-amber-900 underline">
                Lançar data anterior
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
