import { COUNTRY_CURRENCY } from "@/constants/country-currency";
import { FX_UNITS_PER_USD } from "@/constants/fx-rates";
import { WORLD_CURRENCY_CODES } from "@/constants/world-currencies";

export interface CurrencyOption {
  code: string;
}

export const DEFAULT_CURRENCY = "USD";

/** All ISO 4217 account currencies (170+ codes). */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = WORLD_CURRENCY_CODES.map((code) => ({ code }));

const SUPPORTED_SET = new Set<string>(WORLD_CURRENCY_CODES);

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: string): Intl.DisplayNames {
  const cached = displayNamesCache.get(locale);
  if (cached) return cached;
  const names = new Intl.DisplayNames([locale], { type: "currency" });
  displayNamesCache.set(locale, names);
  return names;
}

export function isSupportedCurrency(code: string | null | undefined): code is string {
  return Boolean(code && SUPPORTED_SET.has(code.toUpperCase()));
}

export function normalizeCurrency(code: string | null | undefined): string {
  const upper = code?.toUpperCase().trim() ?? "";
  return isSupportedCurrency(upper) ? upper : DEFAULT_CURRENCY;
}

export function getCurrencyDisplayName(code: string, locale = "en"): string {
  const normalized = normalizeCurrency(code);
  try {
    return getDisplayNames(locale).of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
}

export function getCurrencyLocale(code: string): string {
  const normalized = normalizeCurrency(code);
  try {
    const resolved = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalized,
    }).resolvedOptions().locale;
    return resolved ?? "en-US";
  } catch {
    return "en-US";
  }
}

export function suggestCurrencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return DEFAULT_CURRENCY;
  const suggested = COUNTRY_CURRENCY[countryCode.toUpperCase()];
  return isSupportedCurrency(suggested) ? suggested : DEFAULT_CURRENCY;
}

export function fxUnitsPerUsd(code: string): number {
  const normalized = normalizeCurrency(code);
  return FX_UNITS_PER_USD[normalized] ?? 1;
}

export function currencyFractionDigits(code: string): number {
  const normalized = normalizeCurrency(code);
  try {
    return (
      new Intl.NumberFormat("en-US", { style: "currency", currency: normalized }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function roundMoneyForCurrency(amount: number, code: string): number {
  const digits = currencyFractionDigits(code);
  if (digits === 0) return Math.round(amount);
  const factor = 10 ** digits;
  return Math.round(amount * factor) / factor;
}

export { FX_UNITS_PER_USD };
