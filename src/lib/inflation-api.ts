/** World Bank FP.CPI.TOTL.ZG — inflation, consumer prices (annual %). */

export type InflationPoint = {
  iso2: string;
  iso3: string;
  name: string;
  value: number;
  year: string;
};

type WorldBankRow = {
  country?: { id?: string; value?: string };
  countryiso3code?: string;
  date?: string;
  value?: number | null;
};

const WB_URL =
  "https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&per_page=400&mrnev=1";

/** Fallback snapshot (approximate YoY %) so the map always renders. */
export const INFLATION_FALLBACK: InflationPoint[] = [
  { iso2: "AR", iso3: "ARG", name: "Argentina", value: 33.6, year: "2025" },
  { iso2: "TR", iso3: "TUR", name: "Türkiye", value: 32.11, year: "2025" },
  { iso2: "NG", iso3: "NGA", name: "Nigeria", value: 24.2, year: "2025" },
  { iso2: "EG", iso3: "EGY", name: "Egypt", value: 14.1, year: "2025" },
  { iso2: "RU", iso3: "RUS", name: "Russia", value: 6.0, year: "2025" },
  { iso2: "BR", iso3: "BRA", name: "Brazil", value: 4.64, year: "2025" },
  { iso2: "ZA", iso3: "ZAF", name: "South Africa", value: 4.5, year: "2025" },
  { iso2: "US", iso3: "USA", name: "United States", value: 4.2, year: "2025" },
  { iso2: "AU", iso3: "AUS", name: "Australia", value: 4.0, year: "2025" },
  { iso2: "IN", iso3: "IND", name: "India", value: 3.93, year: "2025" },
  { iso2: "MX", iso3: "MEX", name: "Mexico", value: 3.37, year: "2025" },
  { iso2: "ID", iso3: "IDN", name: "Indonesia", value: 3.34, year: "2025" },
  { iso2: "CA", iso3: "CAN", name: "Canada", value: 3.2, year: "2025" },
  { iso2: "KR", iso3: "KOR", name: "South Korea", value: 3.2, year: "2025" },
  { iso2: "GB", iso3: "GBR", name: "United Kingdom", value: 3.4, year: "2025" },
  { iso2: "DE", iso3: "DEU", name: "Germany", value: 2.1, year: "2025" },
  { iso2: "FR", iso3: "FRA", name: "France", value: 1.8, year: "2025" },
  { iso2: "IT", iso3: "ITA", name: "Italy", value: 1.5, year: "2025" },
  { iso2: "JP", iso3: "JPN", name: "Japan", value: 2.8, year: "2025" },
  { iso2: "CN", iso3: "CHN", name: "China", value: 0.5, year: "2025" },
  { iso2: "SA", iso3: "SAU", name: "Saudi Arabia", value: 1.9, year: "2025" },
  { iso2: "AE", iso3: "ARE", name: "United Arab Emirates", value: 1.6, year: "2025" },
  { iso2: "PL", iso3: "POL", name: "Poland", value: 4.1, year: "2025" },
  { iso2: "ES", iso3: "ESP", name: "Spain", value: 2.4, year: "2025" },
  { iso2: "NL", iso3: "NLD", name: "Netherlands", value: 2.9, year: "2025" },
  { iso2: "SE", iso3: "SWE", name: "Sweden", value: 2.2, year: "2025" },
  { iso2: "CH", iso3: "CHE", name: "Switzerland", value: 0.8, year: "2025" },
  { iso2: "NO", iso3: "NOR", name: "Norway", value: 2.6, year: "2025" },
  { iso2: "CL", iso3: "CHL", name: "Chile", value: 4.5, year: "2025" },
  { iso2: "CO", iso3: "COL", name: "Colombia", value: 5.2, year: "2025" },
  { iso2: "PE", iso3: "PER", name: "Peru", value: 2.1, year: "2025" },
  { iso2: "PH", iso3: "PHL", name: "Philippines", value: 3.0, year: "2025" },
  { iso2: "TH", iso3: "THA", name: "Thailand", value: 1.2, year: "2025" },
  { iso2: "VN", iso3: "VNM", name: "Vietnam", value: 3.5, year: "2025" },
  { iso2: "MY", iso3: "MYS", name: "Malaysia", value: 1.8, year: "2025" },
  { iso2: "SG", iso3: "SGP", name: "Singapore", value: 1.6, year: "2025" },
  { iso2: "NZ", iso3: "NZL", name: "New Zealand", value: 2.7, year: "2025" },
  { iso2: "IL", iso3: "ISR", name: "Israel", value: 3.1, year: "2025" },
  { iso2: "PK", iso3: "PAK", name: "Pakistan", value: 12.4, year: "2025" },
  { iso2: "BD", iso3: "BGD", name: "Bangladesh", value: 9.2, year: "2025" },
  { iso2: "KE", iso3: "KEN", name: "Kenya", value: 5.8, year: "2025" },
  { iso2: "GH", iso3: "GHA", name: "Ghana", value: 18.5, year: "2025" },
  { iso2: "ET", iso3: "ETH", name: "Ethiopia", value: 16.8, year: "2025" },
  { iso2: "UA", iso3: "UKR", name: "Ukraine", value: 8.9, year: "2025" },
  { iso2: "KZ", iso3: "KAZ", name: "Kazakhstan", value: 8.4, year: "2025" },
  { iso2: "UZ", iso3: "UZB", name: "Uzbekistan", value: 9.5, year: "2025" },
  { iso2: "IQ", iso3: "IRQ", name: "Iraq", value: 3.2, year: "2025" },
  { iso2: "IR", iso3: "IRN", name: "Iran", value: 31.5, year: "2025" },
  { iso2: "VE", iso3: "VEN", name: "Venezuela", value: 48.0, year: "2025" },
];

function isCountryCode(iso3: string) {
  // Skip aggregates (AFE, WLD, EUU, etc.) — real countries are 3 letters and present in ISO set
  return /^[A-Z]{3}$/.test(iso3) && !["AFE", "AFW", "ARB", "CSS", "CEB", "EAR", "EAS", "ECA", "ECS", "EMU", "EUU", "FCS", "HIC", "HPC", "IBD", "IBT", "IDA", "IDB", "IDX", "LAC", "LCN", "LDC", "LIC", "LMC", "LMY", "LTE", "MEA", "MIC", "MNA", "NAC", "OED", "OSS", "PRE", "PSS", "PST", "SAS", "SSA", "SSF", "SST", "TEA", "TEC", "TLA", "TMN", "TSA", "TSS", "UMC", "WLD", "INX"].includes(iso3);
}

export function parseWorldBankInflation(payload: unknown): InflationPoint[] {
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) return [];
  const rows = payload[1] as WorldBankRow[];
  const out: InflationPoint[] = [];

  for (const row of rows) {
    const iso3 = (row.countryiso3code || "").toUpperCase();
    const value = row.value;
    if (value == null || !Number.isFinite(value) || !isCountryCode(iso3)) continue;
    out.push({
      iso2: (row.country?.id || "").toUpperCase(),
      iso3,
      name: row.country?.value || iso3,
      value,
      year: row.date || "",
    });
  }

  return out;
}

export async function fetchInflationRates(signal?: AbortSignal): Promise<{
  data: InflationPoint[];
  source: "worldbank" | "fallback";
}> {
  try {
    const res = await fetch(WB_URL, { signal });
    if (!res.ok) throw new Error(`World Bank HTTP ${res.status}`);
    const json = await res.json();
    const data = parseWorldBankInflation(json);
    if (data.length < 20) throw new Error("Too few inflation rows");
    return { data, source: "worldbank" };
  } catch {
    return { data: INFLATION_FALLBACK, source: "fallback" };
  }
}

/** TradingView-like cream → orange → deep red scale (0% … 7% … 25%+). */
export function inflationColor(value: number | null | undefined, isLight: boolean): string {
  if (value == null || !Number.isFinite(value)) {
    return isLight ? "#e8e4dc" : "#2a2a2e";
  }
  const t = Math.max(0, Math.min(1, value / 25));
  // piecewise toward 7% midpoint emphasis
  const stops = [
    { t: 0, c: [250, 243, 230] },
    { t: 0.28, c: [245, 200, 150] }, // ~7%
    { t: 0.55, c: [230, 120, 70] },
    { t: 1, c: [140, 35, 20] },
  ];
  let i = 0;
  while (i < stops.length - 1 && t > stops[i + 1].t) i++;
  const a = stops[i];
  const b = stops[Math.min(i + 1, stops.length - 1)];
  const span = b.t - a.t || 1;
  const u = (t - a.t) / span;
  const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * u);
  const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * u);
  const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * u);
  return `rgb(${r},${g},${bl})`;
}

export function inflationByIso3(points: InflationPoint[]): Map<string, InflationPoint> {
  const map = new Map<string, InflationPoint>();
  for (const p of points) map.set(p.iso3, p);
  return map;
}
