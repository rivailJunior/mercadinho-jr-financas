import { CURRENCY_CODE, CURRENCY_LOCALE } from "@/constants/cashClosing";

/**
 * Money is always represented as an integer number of cents (centavos).
 *
 * Never use floating-point reais for critical calculations: a value like
 * `0.1 + 0.2` is not `0.3` in IEEE-754. By keeping money as whole cents we get
 * exact integer arithmetic and only convert to a fractional representation at
 * the UI boundary (formatting) or when reading human input (parsing).
 */
export type Cents = number;

/** Throws if a value is not a safe integer number of cents. */
export const assertCents = (value: number): Cents => {
  if (!Number.isInteger(value)) {
    throw new Error(`Money value must be an integer number of cents, received: ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Money value exceeds the safe integer range: ${value}`);
  }
  return value;
};

/** Converts a value in reais (e.g. 12.21) to integer cents (1221). */
export const reaisToCents = (reais: number): Cents => {
  if (!Number.isFinite(reais)) {
    throw new Error(`Cannot convert a non-finite value to cents: ${reais}`);
  }
  // Round to the nearest cent to absorb float representation error.
  return Math.round(reais * 100);
};

/** Converts integer cents (1221) to a reais number (12.21). UI/display only. */
export const centsToReais = (cents: Cents): number => assertCents(cents) / 100;

/**
 * Parses a human-typed currency string into cents.
 * Accepts pt-BR ("R$ 1.234,56", "1.234,56", "-R$ 10,00") and bare integers.
 */
export const parseCentsInput = (raw: string): Cents => {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return 0;
  const negative = trimmed.startsWith("-");
  // Keep only digits, then interpret the last two as the cents fraction.
  const digits = trimmed.replace(/\D/g, "");
  if (digits === "") return 0;
  const value = Number.parseInt(digits, 10);
  return negative ? -value : value;
};

/** Formats cents as a BRL currency string (e.g. 1221 -> "R$ 12,21"). */
export const formatCents = (cents: Cents): string =>
  new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToReais(cents));

/** Sum of cent values (exact). */
export const sumCents = (...values: Cents[]): Cents =>
  values.reduce((acc, v) => assertCents(acc) + assertCents(v), 0);

/** Clamps a cents value to be at least zero (no negative floor). */
export const clampNonNegative = (cents: Cents): Cents => (cents < 0 ? 0 : assertCents(cents));

/**
 * Splits an amount of cents into `parts` as evenly as possible with no cents
 * lost or created: the remainder is distributed one extra cent at a time to the
 * first buckets. Guarantees `sum(result) === amount`.
 */
export const allocateEvenly = (amount: Cents, parts: number): Cents[] => {
  assertCents(amount);
  if (parts <= 0) throw new Error(`parts must be a positive integer, received: ${parts}`);
  const base = Math.trunc(amount / parts);
  let remainder = amount - base * parts;
  const step = remainder >= 0 ? 1 : -1;
  remainder = Math.abs(remainder);
  return Array.from({ length: parts }, (_, i) => (i < remainder ? base + step : base));
};
