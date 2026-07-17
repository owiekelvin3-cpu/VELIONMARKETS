import {
  DEFAULT_CURRENCY,
  getCurrencyLocale,
  normalizeCurrency,
} from "@/constants/currencies";

let activeCurrency = DEFAULT_CURRENCY;

export function setActiveCurrency(code: string | null | undefined) {
  activeCurrency = normalizeCurrency(code);
}

export function getActiveCurrency(): string {
  return activeCurrency;
}

export function formatMoney(amount: number, currency?: string) {
  const code = normalizeCurrency(currency ?? activeCurrency);
  const locale = getCurrencyLocale(code);
  const fractionDigits = code === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}
