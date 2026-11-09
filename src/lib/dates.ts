/** Business timezone for the store (UTC-4, no daylight saving). */
export const MANAUS_TIME_ZONE = "America/Manaus";

const DAY_MS = 86_400_000;

const datePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: MANAUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: MANAUS_TIME_ZONE,
  day: "2-digit",
  month: "short",
});

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const MESES = [
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
] as const;

export const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** Formats an instant as a Manaus calendar date (YYYY-MM-DD). */
export const toManausISODate = (date: Date): string => {
  const parts = datePartsFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

/** Today's date in Manaus (YYYY-MM-DD). */
export const todayISODate = (): string => toManausISODate(new Date());

/** Manaus calendar date `days` days ago (YYYY-MM-DD). Safe: Manaus has no DST. */
export const daysAgoISODate = (days: number): string =>
  toManausISODate(new Date(Date.now() - days * DAY_MS));

/** Whole calendar days from `fromIso` to `toIso` (negative when `from` is later). */
export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round(
    (new Date(`${toIso}T12:00:00Z`).getTime() - new Date(`${fromIso}T12:00:00Z`).getTime()) /
      DAY_MS,
  );

/** Day-of-week index (0 = Sunday) for a YYYY-MM-DD date. */
export const weekdayIndexFromISODate = (isoDate: string): number =>
  new Date(`${isoDate}T12:00:00Z`).getUTCDay();

/** Formats a YYYY-MM-DD date like "29 de out." (Manaus). */
export const formatShortISODate = (isoDate: string): string =>
  shortDateFormatter.format(new Date(`${isoDate}T12:00:00Z`));

/** Whether a string is a valid YYYY-MM month key. */
export const isValidMonthKey = (mes: string): boolean => /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);

/** Whether a string is a valid YYYY-MM-DD calendar date. */
export const isValidISODate = (isoDate: string): boolean => {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(isoDate)) return false;
  const [year, month, day] = isoDate.split("-").map(Number);
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
};

/** Current month key (YYYY-MM) in Manaus. */
export const currentMonthKey = (): string => todayISODate().slice(0, 7);

/** Shifts a YYYY-MM month key by `delta` months, keeping YYYY-MM format. */
export const shiftMonth = (mes: string, delta: number): string => {
  const [year, month] = mes.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Inclusive [start, end] ISO dates covering a whole YYYY-MM month. */
export const monthBounds = (mes: string): { start: string; end: string } => {
  const [year, month] = mes.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start: `${mes}-01`, end: `${mes}-${String(lastDay).padStart(2, "0")}` };
};

/** Formats a YYYY-MM month key like "Outubro / 2024". */
export const formatMonthLabel = (mes: string): string =>
  `${MESES[Number(mes.slice(5, 7)) - 1]} / ${mes.slice(0, 4)}`;

/** Formats a YYYY-MM-DD date like "24/10/2024 · Quinta". */
export const formatLancamentoDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year} · ${DIAS_SEMANA[weekdayIndexFromISODate(isoDate)]}`;
};
