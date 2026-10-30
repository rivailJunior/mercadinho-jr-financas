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

/** Day-of-week index (0 = Sunday) for a YYYY-MM-DD date. */
export const weekdayIndexFromISODate = (isoDate: string): number =>
  new Date(`${isoDate}T12:00:00Z`).getUTCDay();

/** Formats a YYYY-MM-DD date like "29 de out." (Manaus). */
export const formatShortISODate = (isoDate: string): string =>
  shortDateFormatter.format(new Date(`${isoDate}T12:00:00Z`));
