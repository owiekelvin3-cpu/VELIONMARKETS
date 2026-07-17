export interface CurrencyOption {
  code: string;
  labelKey: string;
  /** BCP 47 locale for Intl currency formatting */
  locale: string;
}

/** Fiat account currencies supported by the platform. */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "USD", labelKey: "currencies.USD", locale: "en-US" },
  { code: "EUR", labelKey: "currencies.EUR", locale: "de-DE" },
  { code: "GBP", labelKey: "currencies.GBP", locale: "en-GB" },
  { code: "AUD", labelKey: "currencies.AUD", locale: "en-AU" },
  { code: "CAD", labelKey: "currencies.CAD", locale: "en-CA" },
  { code: "CHF", labelKey: "currencies.CHF", locale: "de-CH" },
  { code: "JPY", labelKey: "currencies.JPY", locale: "ja-JP" },
  { code: "AED", labelKey: "currencies.AED", locale: "ar-AE" },
  { code: "SGD", labelKey: "currencies.SGD", locale: "en-SG" },
  { code: "HKD", labelKey: "currencies.HKD", locale: "zh-HK" },
];

export const DEFAULT_CURRENCY = "USD";

const SUPPORTED_SET = new Set(SUPPORTED_CURRENCIES.map((c) => c.code));

/** Suggest account currency from ISO country code at registration. */
const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  JP: "JPY",
  AE: "AED",
  SG: "SGD",
  HK: "HKD",
  AT: "EUR",
  BE: "EUR",
  CY: "EUR",
  DE: "EUR",
  EE: "EUR",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GR: "EUR",
  IE: "EUR",
  IT: "EUR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MT: "EUR",
  NL: "EUR",
  PT: "EUR",
  SK: "EUR",
  SI: "EUR",
};

export function isSupportedCurrency(code: string | null | undefined): code is string {
  return Boolean(code && SUPPORTED_SET.has(code.toUpperCase()));
}

export function normalizeCurrency(code: string | null | undefined): string {
  const upper = code?.toUpperCase().trim() ?? "";
  return isSupportedCurrency(upper) ? upper : DEFAULT_CURRENCY;
}

export function getCurrencyLocale(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.locale ?? "en-US";
}

export function suggestCurrencyForCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return DEFAULT_CURRENCY;
  const suggested = COUNTRY_CURRENCY[countryCode.toUpperCase()];
  return isSupportedCurrency(suggested) ? suggested : DEFAULT_CURRENCY;
}
