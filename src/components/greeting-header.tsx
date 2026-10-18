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

const getFormattedDate = (): string => {
  const now = new Date();
  const weekday = WEEKDAYS[now.getDay()];
  const day = now.getDate();
  const month = MONTHS[now.getMonth()];
  return `${weekday}, ${day} de ${month}`;
};

export const GreetingHeader = () => {
  const dateString = getFormattedDate();

  return (
    <header className="flex flex-col gap-(--space-sm)">
      <h1 className="text-[24px] font-bold leading-8 tracking-[-0.01em] text-slate-900">
        Olá, Pai &amp; Mãe! 👋
      </h1>
      <p className="text-[14px] font-medium leading-5 text-slate-500">
        {dateString}
      </p>
      <p className="text-[16px] leading-6 text-slate-700">
        Bora fechar o caixinha de hoje de forma rápida e tranquila?
      </p>
    </header>
  );
};
