import { CURRENCY_CODE, CURRENCY_LOCALE } from "@/constants/cashClosing";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseCurrencyInput = (raw: string): number => {
  const cleaned = raw.replace(/[^\d]/g, "");
  return Number(cleaned) / 100;
};
