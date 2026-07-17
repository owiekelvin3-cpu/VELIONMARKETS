import fs from "fs";

const fx = JSON.parse(fs.readFileSync("src/constants/fx-rates.generated.json", "utf8"));
const intl = Intl.supportedValuesOf("currency");
for (const c of intl) {
  if (!fx[c]) fx[c] = 1;
}
fx.USD = 1;

const COUNTRY_CURRENCY = {
  AF: "AFN", AL: "ALL", DZ: "DZD", AD: "EUR", AO: "AOA", AR: "ARS", AM: "AMD",
  AU: "AUD", AT: "EUR", AZ: "AZN", BS: "BSD", BH: "BHD", BD: "BDT", BB: "BBD",
  BY: "BYN", BE: "EUR", BZ: "BZD", BJ: "XOF", BM: "BMD", BT: "BTN", BO: "BOB",
  BA: "BAM", BW: "BWP", BR: "BRL", BN: "BND", BG: "BGN", BF: "XOF", BI: "BIF",
  KH: "KHR", CM: "XAF", CA: "CAD", CV: "CVE", KY: "KYD", CF: "XAF", TD: "XAF",
  CL: "CLP", CN: "CNY", CO: "COP", KM: "KMF", CG: "XAF", CD: "CDF", CR: "CRC",
  CI: "XOF", HR: "EUR", CU: "CUP", CY: "EUR", CZ: "CZK", DK: "DKK", DJ: "DJF",
  DM: "XCD", DO: "DOP", EC: "USD", EG: "EGP", SV: "USD", GQ: "XAF", ER: "ERN",
  EE: "EUR", SZ: "SZL", ET: "ETB", FJ: "FJD", FI: "EUR", FR: "EUR", GA: "XAF",
  GM: "GMD", GE: "GEL", DE: "EUR", GH: "GHS", GR: "EUR", GD: "XCD", GT: "GTQ",
  GN: "GNF", GW: "XOF", GY: "GYD", HT: "HTG", HN: "HNL", HK: "HKD", HU: "HUF",
  IS: "ISK", IN: "INR", ID: "IDR", IR: "IRR", IQ: "IQD", IE: "EUR", IL: "ILS",
  IT: "EUR", JM: "JMD", JP: "JPY", JO: "JOD", KZ: "KZT", KE: "KES", KW: "KWD",
  KG: "KGS", LA: "LAK", LV: "EUR", LB: "LBP", LS: "LSL", LR: "LRD", LY: "LYD",
  LI: "CHF", LT: "EUR", LU: "EUR", MO: "MOP", MG: "MGA", MW: "MWK", MY: "MYR",
  MV: "MVR", ML: "XOF", MT: "EUR", MR: "MRU", MU: "MUR", MX: "MXN", MD: "MDL",
  MC: "EUR", MN: "MNT", ME: "EUR", MA: "MAD", MZ: "MZN", MM: "MMK", NA: "NAD",
  NP: "NPR", NL: "EUR", NZ: "NZD", NI: "NIO", NE: "XOF", NG: "NGN", MK: "MKD",
  NO: "NOK", OM: "OMR", PK: "PKR", PS: "ILS", PA: "PAB", PG: "PGK", PY: "PYG",
  PE: "PEN", PH: "PHP", PL: "PLN", PT: "EUR", PR: "USD", QA: "QAR", RO: "RON",
  RU: "RUB", RW: "RWF", SA: "SAR", SN: "XOF", RS: "RSD", SC: "SCR", SL: "SLE",
  SG: "SGD", SK: "EUR", SI: "EUR", SO: "SOS", ZA: "ZAR", KR: "KRW", SS: "SSP",
  ES: "EUR", LK: "LKR", SD: "SDG", SR: "SRD", SE: "SEK", CH: "CHF", SY: "SYP",
  TW: "TWD", TJ: "TJS", TZ: "TZS", TH: "THB", TL: "USD", TG: "XOF", TT: "TTD",
  TN: "TND", TR: "TRY", TM: "TMT", UG: "UGX", UA: "UAH", AE: "AED", GB: "GBP",
  US: "USD", UY: "UYU", UZ: "UZS", VE: "VES", VN: "VND", YE: "YER", ZM: "ZMW",
  ZW: "ZWG",
};

const codes = [...new Set([...Object.keys(fx), ...intl])].sort();

const fxLines = codes.map((c) => `  ${JSON.stringify(c)}: ${fx[c]},`).join("\n");
fs.writeFileSync(
  "src/constants/fx-rates.ts",
  `/** Reference FX snapshot: local currency units per 1 USD. */\nexport const FX_UNITS_PER_USD: Record<string, number> = {\n${fxLines}\n};\n`
);

const ccLines = Object.entries(COUNTRY_CURRENCY)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");
fs.writeFileSync(
  "src/constants/country-currency.ts",
  `/** ISO 3166-1 alpha-2 to ISO 4217 mapping for registration defaults. */\nexport const COUNTRY_CURRENCY: Record<string, string> = {\n${ccLines}\n};\n`
);

const wc = codes.map((c) => `  ${JSON.stringify(c)}`).join(",\n");
fs.writeFileSync(
  "src/constants/world-currencies.ts",
  `/** ISO 4217 currencies available for client accounts. */\nexport const WORLD_CURRENCY_CODES = [\n${wc}\n] as const;\n\nexport type WorldCurrencyCode = (typeof WORLD_CURRENCY_CODES)[number];\n`
);

const inserts = codes.map((c) => `  ('${c}', ${fx[c]})`).join(",\n");
const sql = `-- World currencies: full ISO 4217 support with FX reference rates

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_currency_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_currency_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_currency_format
  CHECK (preferred_currency ~ '^[A-Z]{3}$');

CREATE TABLE IF NOT EXISTS public.fx_rates (
  currency text PRIMARY KEY CHECK (char_length(currency) = 3),
  units_per_usd numeric NOT NULL CHECK (units_per_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.fx_rates (currency, units_per_usd)
VALUES
${inserts}
ON CONFLICT (currency) DO UPDATE SET
  units_per_usd = EXCLUDED.units_per_usd,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.normalize_account_currency(p_code text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_code text := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF v_code !~ '^[A-Z]{3}$' THEN
    RETURN 'USD';
  END IF;
  IF EXISTS (SELECT 1 FROM public.fx_rates WHERE currency = v_code) THEN
    RETURN v_code;
  END IF;
  RETURN 'USD';
END;
$$;

CREATE OR REPLACE FUNCTION public.fx_units_per_usd(p_currency text)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT units_per_usd FROM public.fx_rates WHERE currency = public.normalize_account_currency(p_currency)),
    1.0
  );
$$;

ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read fx rates" ON public.fx_rates;
CREATE POLICY "Anyone can read fx rates" ON public.fx_rates FOR SELECT USING (true);
`;

fs.writeFileSync("supabase/migrations/033_world_currencies.sql", sql);
console.log(`Generated ${codes.length} currencies`);
