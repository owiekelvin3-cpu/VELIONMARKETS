import {
  DEFAULT_CURRENCY,
  fxUnitsPerUsd,
  getCurrencyLocale,
  normalizeCurrency,
  roundMoneyForCurrency,
  currencyFractionDigits,
} from "@/constants/currencies";

let activeCurrency = DEFAULT_CURRENCY;

export function setActiveCurrency(code: string | null | undefined) {
  activeCurrency = normalizeCurrency(code);
}

export function getActiveCurrency(): string {
  return activeCurrency;
}

/** Convert between account currencies using USD cross-rates. */
export function convertAmount(amount: number, from: string, to: string): number {
  const fromCode = normalizeCurrency(from);
  const toCode = normalizeCurrency(to);
  if (fromCode === toCode) return roundMoneyForCurrency(amount, toCode);

  const usd = amount / fxUnitsPerUsd(fromCode);
  const converted = usd * fxUnitsPerUsd(toCode);
  return roundMoneyForCurrency(converted, toCode);
}

/** Catalog prices are stored in USD — convert to the active account currency. */
export function convertFromUsd(usdAmount: number, to?: string): number {
  return convertAmount(usdAmount, DEFAULT_CURRENCY, to ?? activeCurrency);
}

export function formatMoney(amount: number, currency?: string) {
  const code = normalizeCurrency(currency ?? activeCurrency);
  const locale = getCurrencyLocale(code);
  const fractionDigits = currencyFractionDigits(code);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

export interface CurrencyConversionResult {
  ok: boolean;
  fromCurrency: string;
  toCurrency: string;
  balance: number;
  balanceBefore?: number;
  converted: boolean;
}

export function parseCurrencyConversionResult(data: unknown): CurrencyConversionResult | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  return {
    ok: row.ok === true,
    fromCurrency: normalizeCurrency(String(row.from_currency ?? DEFAULT_CURRENCY)),
    toCurrency: normalizeCurrency(String(row.to_currency ?? DEFAULT_CURRENCY)),
    balance: Number(row.balance ?? 0),
    balanceBefore: row.balance_before != null ? Number(row.balance_before) : undefined,
    converted: row.converted === true,
  };
}
