/** Demo macro / economy data styled after TradingView World Economy pages. */

export type EconomyMetricRow = {
  country: string;
  code: string;
  value: number;
  display: string;
  secondary?: string;
  sparkline: number[];
};

export type MacroIdea = {
  id: string;
  title: string;
  symbol: string;
  author: string;
  bias: "long" | "short" | "neutral";
  snippet: string;
};

export type CalendarEvent = {
  id: string;
  time: string;
  country: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
};

export type ForexNewsItem = {
  id: string;
  time: string;
  instrument: string;
  headline: string;
  provider: string;
  top?: boolean;
};

export type HeatmapCell = {
  country: string;
  gdp: number;
  gdpGrowth: number;
  debt: number;
  rate: number;
  inflation: number;
  unemployment: number;
  industrial: number;
};

function spark(seed: number, len = 20, drift = 0.4): number[] {
  const points: number[] = [];
  let v = 40 + (seed % 20);
  for (let i = 0; i < len; i++) {
    v += Math.sin(seed + i * 0.7) * drift + ((seed * (i + 2)) % 5) / 10 - 0.2;
    points.push(Math.round(v * 10) / 10);
  }
  return points;
}

export const ECONOMY_COUNTRIES = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "European Union",
  "France",
  "Germany",
  "India",
  "Indonesia",
  "Italy",
  "Japan",
  "Mainland China",
  "Mexico",
  "Russia",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
  "Turkey",
  "United Kingdom",
  "United States",
] as const;

export const ECONOMY_GDP_GROWTH: EconomyMetricRow[] = [
  { country: "India", code: "IN", value: 7.8, display: "7.80%", secondary: "3.96 T USD", sparkline: spark(11) },
  { country: "Indonesia", code: "ID", value: 5.61, display: "5.61%", secondary: "1.45 T USD", sparkline: spark(22) },
  { country: "Mainland China", code: "CN", value: 5.0, display: "5.00%", secondary: "19.50 T USD", sparkline: spark(33) },
  { country: "South Korea", code: "KR", value: 3.8, display: "3.80%", secondary: "1.87 T USD", sparkline: spark(44) },
  { country: "Saudi Arabia", code: "SA", value: 3.0, display: "3.00%", secondary: "1.28 T USD", sparkline: spark(55) },
  { country: "USA", code: "US", value: 2.7, display: "2.70%", secondary: "30.77 T USD", sparkline: spark(66) },
  { country: "Australia", code: "AU", value: 2.5, display: "2.50%", secondary: "1.78 T USD", sparkline: spark(77) },
  { country: "Turkey", code: "TR", value: 2.5, display: "2.50%", secondary: "1.13 T USD", sparkline: spark(88) },
];

export const ECONOMY_INFLATION: EconomyMetricRow[] = [
  { country: "Argentina", code: "AR", value: 33.6, display: "33.60%", sparkline: spark(101, 20, 0.9) },
  { country: "Turkey", code: "TR", value: 32.11, display: "32.11%", sparkline: spark(112, 20, 0.85) },
  { country: "Russia", code: "RU", value: 6.0, display: "6.00%", sparkline: spark(123) },
  { country: "Brazil", code: "BR", value: 4.64, display: "4.64%", sparkline: spark(134) },
  { country: "South Africa", code: "ZA", value: 4.5, display: "4.50%", sparkline: spark(145) },
  { country: "USA", code: "US", value: 4.2, display: "4.20%", sparkline: spark(156) },
  { country: "Australia", code: "AU", value: 4.0, display: "4.00%", sparkline: spark(167) },
  { country: "India", code: "IN", value: 3.93, display: "3.93%", sparkline: spark(178) },
  { country: "Mexico", code: "MX", value: 3.37, display: "3.37%", sparkline: spark(189) },
  { country: "Indonesia", code: "ID", value: 3.34, display: "3.34%", sparkline: spark(200) },
  { country: "Canada", code: "CA", value: 3.2, display: "3.20%", sparkline: spark(211) },
  { country: "South Korea", code: "KR", value: 3.2, display: "3.20%", sparkline: spark(222) },
];

export const ECONOMY_UNEMPLOYMENT: EconomyMetricRow[] = [
  { country: "South Africa", code: "ZA", value: 32.7, display: "32.70%", sparkline: spark(301) },
  { country: "Turkey", code: "TR", value: 8.2, display: "8.20%", sparkline: spark(312) },
  { country: "France", code: "FR", value: 8.1, display: "8.10%", sparkline: spark(323) },
  { country: "Argentina", code: "AR", value: 7.8, display: "7.80%", sparkline: spark(334) },
  { country: "Canada", code: "CA", value: 6.5, display: "6.50%", sparkline: spark(345) },
  { country: "Germany", code: "DE", value: 6.3, display: "6.30%", sparkline: spark(356) },
  { country: "Brazil", code: "BR", value: 5.6, display: "5.60%", sparkline: spark(367) },
  { country: "India", code: "IN", value: 5.5, display: "5.50%", sparkline: spark(378) },
  { country: "Mainland China", code: "CN", value: 5.1, display: "5.10%", sparkline: spark(389) },
  { country: "Italy", code: "IT", value: 5.0, display: "5.00%", sparkline: spark(400) },
  { country: "United Kingdom", code: "GB", value: 4.9, display: "4.90%", sparkline: spark(411) },
  { country: "Indonesia", code: "ID", value: 4.68, display: "4.68%", sparkline: spark(422) },
];

export const ECONOMY_INDUSTRIAL: EconomyMetricRow[] = [
  { country: "India", code: "IN", value: 5.1, display: "5.10%", sparkline: spark(501) },
  { country: "Mainland China", code: "CN", value: 4.5, display: "4.50%", sparkline: spark(512) },
  { country: "France", code: "FR", value: 3.2, display: "3.20%", sparkline: spark(523) },
  { country: "Australia", code: "AU", value: 2.5, display: "2.50%", sparkline: spark(534) },
  { country: "USA", code: "US", value: 1.7, display: "1.70%", sparkline: spark(545) },
  { country: "Italy", code: "IT", value: 1.1, display: "1.10%", sparkline: spark(556) },
  { country: "Canada", code: "CA", value: 0.2, display: "0.20%", sparkline: spark(567) },
  { country: "Brazil", code: "BR", value: 0.2, display: "0.20%", sparkline: spark(578) },
  { country: "Germany", code: "DE", value: 0.0, display: "0.00%", sparkline: spark(589) },
  { country: "Turkey", code: "TR", value: 0.0, display: "0.00%", sparkline: spark(600) },
  { country: "United Kingdom", code: "GB", value: -0.2, display: "−0.20%", sparkline: spark(611) },
  { country: "Russia", code: "RU", value: -0.7, display: "−0.70%", sparkline: spark(622) },
];

export const ECONOMY_DEBT: EconomyMetricRow[] = [
  { country: "Japan", code: "JP", value: 248.7, display: "248.70%", sparkline: spark(701) },
  { country: "Italy", code: "IT", value: 137.1, display: "137.10%", sparkline: spark(712) },
  { country: "USA", code: "US", value: 123.3, display: "123.30%", sparkline: spark(723) },
  { country: "France", code: "FR", value: 115.6, display: "115.60%", sparkline: spark(734) },
  { country: "Canada", code: "CA", value: 113.5, display: "113.50%", sparkline: spark(745) },
  { country: "Mainland China", code: "CN", value: 99.2, display: "99.20%", sparkline: spark(756) },
  { country: "United Kingdom", code: "GB", value: 94.3, display: "94.30%", sparkline: spark(767) },
  { country: "India", code: "IN", value: 81.92, display: "81.92%", sparkline: spark(778) },
  { country: "South Africa", code: "ZA", value: 78.9, display: "78.90%", sparkline: spark(789) },
  { country: "Brazil", code: "BR", value: 78.64, display: "78.64%", sparkline: spark(800) },
  { country: "Argentina", code: "AR", value: 78.4, display: "78.40%", sparkline: spark(811) },
  { country: "Germany", code: "DE", value: 63.5, display: "63.50%", sparkline: spark(822) },
];

export const ECONOMY_RATES: EconomyMetricRow[] = [
  { country: "Turkey", code: "TR", value: 37.0, display: "37.00%", sparkline: spark(901) },
  { country: "Argentina", code: "AR", value: 29.0, display: "29.00%", sparkline: spark(912) },
  { country: "Russia", code: "RU", value: 14.25, display: "14.25%", sparkline: spark(923) },
  { country: "Brazil", code: "BR", value: 14.25, display: "14.25%", sparkline: spark(934) },
  { country: "South Africa", code: "ZA", value: 7.0, display: "7.00%", sparkline: spark(945) },
  { country: "Mexico", code: "MX", value: 6.5, display: "6.50%", sparkline: spark(956) },
  { country: "Indonesia", code: "ID", value: 5.75, display: "5.75%", sparkline: spark(967) },
  { country: "India", code: "IN", value: 5.25, display: "5.25%", sparkline: spark(978) },
  { country: "Australia", code: "AU", value: 4.35, display: "4.35%", sparkline: spark(989) },
  { country: "Saudi Arabia", code: "SA", value: 4.25, display: "4.25%", sparkline: spark(1000) },
  { country: "USA", code: "US", value: 3.75, display: "3.75%", sparkline: spark(1011) },
  { country: "United Kingdom", code: "GB", value: 3.75, display: "3.75%", sparkline: spark(1022) },
];

export const ECONOMY_US_SNAPSHOT = [
  { id: "usur", labelKey: "economy.usUnemployment", value: "4.2%", symbol: "USUR", change: "−0.1" },
  { id: "usintr", labelKey: "economy.usInterest", value: "3.75%", symbol: "USINTR", change: "0.00" },
  { id: "usbot", labelKey: "economy.usTrade", value: "−$74.6B", symbol: "USBOT", change: "+2.1%" },
] as const;

export const ECONOMY_MACRO_IDEAS: MacroIdea[] = [
  {
    id: "1",
    title: "Yield Curve Inversion — liquidity crunch signals",
    symbol: "ECONOMICS:INGDPYY",
    author: "markda787",
    bias: "neutral",
    snippet: "Chart taking you deep into US yield inversion to indicate liquidity stress when inversion deepens.",
  },
  {
    id: "2",
    title: "The FED printers are on",
    symbol: "ECONOMICS:USCBBS",
    author: "thecryer",
    bias: "long",
    snippet: "Bollinger Bands %B on the Fed balance sheet — watch when the indicator stays in an uptrend.",
  },
  {
    id: "3",
    title: "Another US recession brewing? Part 2",
    symbol: "FRED:USREC",
    author: "AMTrader",
    bias: "short",
    snippet: "Policy rates, inflation, Treasury yields, GDP, and bank balance sheets in one recession study.",
  },
  {
    id: "4",
    title: "U.S. unemployment rate (June 2026)",
    symbol: "ECONOMICS:USUR",
    author: "Mr_J__fx",
    bias: "neutral",
    snippet: "Unemployment dropped to 4.2% as people left the workforce — unemployed fell by 213,000.",
  },
  {
    id: "5",
    title: "Record-low U.S. consumer sentiment",
    symbol: "FRED:UMCSENT",
    author: "konhow",
    bias: "short",
    snippet: "Three readings below 50 — how to navigate markets when sentiment hits historic lows.",
  },
  {
    id: "6",
    title: "Higher yields and debt-to-GDP",
    symbol: "ECONOMICS:USGDG",
    author: "Badcharts",
    bias: "neutral",
    snippet: "Historically, higher yield environments have coincided with falling debt-to-GDP ratios.",
  },
];

export const ECONOMY_HEATMAP: HeatmapCell[] = [
  { country: "USA", gdp: 30.77, gdpGrowth: 2.7, debt: 123.3, rate: 3.75, inflation: 4.2, unemployment: 4.1, industrial: 1.7 },
  { country: "Mainland China", gdp: 19.5, gdpGrowth: 5.0, debt: 99.2, rate: 3.1, inflation: 0.5, unemployment: 5.1, industrial: 4.5 },
  { country: "EU", gdp: 18.4, gdpGrowth: 1.1, debt: 88.0, rate: 2.15, inflation: 2.4, unemployment: 6.0, industrial: 0.4 },
  { country: "Germany", gdp: 4.7, gdpGrowth: 0.2, debt: 63.5, rate: 2.15, inflation: 2.1, unemployment: 6.3, industrial: 0.0 },
  { country: "Japan", gdp: 4.1, gdpGrowth: 0.9, debt: 248.7, rate: 0.5, inflation: 2.8, unemployment: 2.5, industrial: -1.2 },
  { country: "UK", gdp: 3.6, gdpGrowth: 0.9, debt: 94.3, rate: 3.75, inflation: 3.4, unemployment: 4.9, industrial: -0.2 },
  { country: "India", gdp: 3.96, gdpGrowth: 7.8, debt: 81.92, rate: 5.25, inflation: 3.93, unemployment: 5.5, industrial: 5.1 },
  { country: "France", gdp: 3.2, gdpGrowth: 1.0, debt: 115.6, rate: 2.15, inflation: 1.8, unemployment: 8.1, industrial: 3.2 },
  { country: "Russia", gdp: 2.0, gdpGrowth: 1.4, debt: 19.0, rate: 14.25, inflation: 6.0, unemployment: 2.4, industrial: -0.7 },
  { country: "Canada", gdp: 2.2, gdpGrowth: 1.6, debt: 113.5, rate: 2.75, inflation: 3.2, unemployment: 6.5, industrial: 0.2 },
];

export const ECONOMY_CALENDAR: CalendarEvent[] = [
  { id: "1", time: "12:30", country: "US", event: "CPI YoY", impact: "high", actual: "4.2%", forecast: "4.1%" },
  { id: "2", time: "14:00", country: "US", event: "FOMC statement", impact: "high", forecast: "—" },
  { id: "3", time: "09:00", country: "EU", event: "GDP Growth QoQ", impact: "medium", actual: "0.3%", forecast: "0.2%" },
  { id: "4", time: "07:00", country: "UK", event: "Interest Rate Decision", impact: "high", actual: "3.75%", forecast: "3.75%" },
  { id: "5", time: "01:30", country: "CN", event: "Industrial Production YoY", impact: "medium", actual: "4.5%", forecast: "4.3%" },
  { id: "6", time: "08:30", country: "JP", event: "BoJ Policy Rate", impact: "high", forecast: "0.50%" },
];

export const FOREX_NEWS: ForexNewsItem[] = [
  {
    id: "1",
    time: "08:42",
    instrument: "EURUSD",
    headline: "Euro steadies as ECB speakers push back on early cuts",
    provider: "Velion Desk",
    top: true,
  },
  {
    id: "2",
    time: "08:15",
    instrument: "USDJPY",
    headline: "Yen softens after BoJ keeps policy stance unchanged",
    provider: "Reuters Wire",
    top: true,
  },
  {
    id: "3",
    time: "07:58",
    instrument: "GBPUSD",
    headline: "Cable dips ahead of UK services PMI release",
    provider: "Velion Desk",
  },
  {
    id: "4",
    time: "07:40",
    instrument: "USDCHF",
    headline: "Swiss franc firm as risk appetite cools into US open",
    provider: "Market Pulse",
  },
  {
    id: "5",
    time: "07:12",
    instrument: "AUDUSD",
    headline: "Aussie supported by firmer iron ore and China data",
    provider: "Velion Desk",
    top: true,
  },
  {
    id: "6",
    time: "06:55",
    instrument: "USDCAD",
    headline: "Loonie tracks oil rebound; BoC speakers in focus",
    provider: "FX Street",
  },
  {
    id: "7",
    time: "06:30",
    instrument: "NZDUSD",
    headline: "Kiwi steady after dairy auction prints mixed",
    provider: "Market Pulse",
  },
  {
    id: "8",
    time: "06:05",
    instrument: "EURGBP",
    headline: "Cross holds range as both sides await inflation clues",
    provider: "Velion Desk",
  },
  {
    id: "9",
    time: "05:48",
    instrument: "XAUUSD",
    headline: "Gold consolidates near highs as dollar softens",
    provider: "Reuters Wire",
    top: true,
  },
  {
    id: "10",
    time: "05:20",
    instrument: "DXY",
    headline: "Dollar index eases from weekly peak before CPI",
    provider: "FX Street",
  },
];

export type TrendTabId =
  | "inflation"
  | "unemployment"
  | "industrial"
  | "debt"
  | "gdp"
  | "rates";

export const ECONOMY_TREND_TABS: { id: TrendTabId; titleKey: string; subtitleKey: string; rows: EconomyMetricRow[] }[] = [
  { id: "inflation", titleKey: "economy.trends.inflationTitle", subtitleKey: "economy.trends.inflationSub", rows: ECONOMY_INFLATION },
  { id: "unemployment", titleKey: "economy.trends.unemploymentTitle", subtitleKey: "economy.trends.unemploymentSub", rows: ECONOMY_UNEMPLOYMENT },
  { id: "industrial", titleKey: "economy.trends.industrialTitle", subtitleKey: "economy.trends.industrialSub", rows: ECONOMY_INDUSTRIAL },
  { id: "debt", titleKey: "economy.trends.debtTitle", subtitleKey: "economy.trends.debtSub", rows: ECONOMY_DEBT },
  { id: "gdp", titleKey: "economy.trends.gdpTitle", subtitleKey: "economy.trends.gdpSub", rows: ECONOMY_GDP_GROWTH },
  { id: "rates", titleKey: "economy.trends.ratesTitle", subtitleKey: "economy.trends.ratesSub", rows: ECONOMY_RATES },
];
