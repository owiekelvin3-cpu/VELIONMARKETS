export type MarketBias = "long" | "short" | "neutral";

export interface MarketQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  sparkline: number[];
  marketCap?: string;
  volume?: string;
}

export interface MarketInsight {
  id: string;
  title: string;
  symbol: string;
  author: string;
  bias: MarketBias;
  snippet: string;
  href: string;
}

function spark(seed: number, len = 24, drift = 0.45): number[] {
  const points: number[] = [];
  let v = 48 + (seed % 18);
  for (let i = 0; i < len; i++) {
    v += Math.sin(seed + i * 0.65) * drift + ((seed * (i + 3)) % 7) / 12 - 0.28;
    points.push(Math.round(v * 10) / 10);
  }
  return points;
}

export const MARKET_TICKER: MarketQuote[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.0842", change: "+0.12%", up: true, sparkline: spark(11) },
  { symbol: "BTC/USD", name: "Bitcoin", price: "68,420", change: "-0.34%", up: false, sparkline: spark(22, 24, 0.8) },
  { symbol: "XAU/USD", name: "Gold", price: "2,418.30", change: "+0.58%", up: true, sparkline: spark(33) },
  { symbol: "S&P 500", name: "S&P 500", price: "5,634.20", change: "+0.21%", up: true, sparkline: spark(44) },
  { symbol: "ETH/USD", name: "Ethereum", price: "3,612.40", change: "+1.04%", up: true, sparkline: spark(55, 24, 0.9) },
  { symbol: "GBP/USD", name: "British Pound", price: "1.2741", change: "-0.08%", up: false, sparkline: spark(66) },
  { symbol: "NASDAQ", name: "Nasdaq 100", price: "20,184", change: "+0.41%", up: true, sparkline: spark(77) },
  { symbol: "WTI", name: "Crude Oil", price: "81.26", change: "-0.52%", up: false, sparkline: spark(88) },
];

/** Featured US index cards (TradingView Markets hero chips) */
export const MARKET_FEATURED_INDICES: MarketQuote[] = [
  { symbol: "SPX", name: "S&P 500", price: "5,634.20", change: "+0.21%", up: true, sparkline: spark(101) },
  { symbol: "NDX", name: "Nasdaq 100", price: "20,184.10", change: "+0.41%", up: true, sparkline: spark(112) },
  { symbol: "DJI", name: "Dow 30", price: "41,022.75", change: "-0.09%", up: false, sparkline: spark(123) },
  { symbol: "RUT", name: "US 2000 small cap", price: "2,214.80", change: "+0.18%", up: true, sparkline: spark(134) },
  { symbol: "COMP", name: "Nasdaq Composite", price: "18,420.60", change: "+0.36%", up: true, sparkline: spark(145) },
  { symbol: "NYA", name: "NYSE Composite", price: "19,812.40", change: "+0.11%", up: true, sparkline: spark(156) },
];

export const MARKET_WORLD_INDICES: MarketQuote[] = [
  { symbol: "NI225", name: "Japan 225 Index", price: "39,470.20", change: "-0.27%", up: false, sparkline: spark(201) },
  { symbol: "UKX", name: "FTSE 100 Index", price: "8,291.15", change: "+0.18%", up: true, sparkline: spark(212) },
  { symbol: "DAX", name: "DAX Index", price: "18,602.40", change: "+0.33%", up: true, sparkline: spark(223) },
  { symbol: "PX1", name: "CAC 40 Index", price: "7,842.10", change: "+0.22%", up: true, sparkline: spark(234) },
  { symbol: "FTMIB", name: "Milano Italia Borsa", price: "35,120.80", change: "-0.14%", up: false, sparkline: spark(245) },
  { symbol: "IBC", name: "IBEX 35 Index", price: "12,084.50", change: "+0.09%", up: true, sparkline: spark(256) },
  { symbol: "000001", name: "SSE Composite Index", price: "3,412.60", change: "-0.41%", up: false, sparkline: spark(267) },
  { symbol: "HSI", name: "Hang Seng Index", price: "18,920.30", change: "+0.55%", up: true, sparkline: spark(278) },
  { symbol: "NIFTY", name: "Nifty 50 Index", price: "24,610.80", change: "+0.28%", up: true, sparkline: spark(289) },
  { symbol: "IBOV", name: "Bovespa Index", price: "128,420", change: "-0.19%", up: false, sparkline: spark(300) },
];

export const MARKET_FEATURED_STOCKS: MarketQuote[] = [
  { symbol: "NVDA", name: "NVIDIA", price: "142.80", change: "+2.14%", up: true, sparkline: spark(310), marketCap: "5.11 T" },
  { symbol: "AAPL", name: "Apple", price: "228.40", change: "+0.62%", up: true, sparkline: spark(321), marketCap: "4.63 T" },
  { symbol: "AMZN", name: "Amazon", price: "198.20", change: "-0.41%", up: false, sparkline: spark(332), marketCap: "2.64 T" },
  { symbol: "GOOGL", name: "Alphabet", price: "186.50", change: "+0.88%", up: true, sparkline: spark(343), marketCap: "4.33 T" },
  { symbol: "TSLA", name: "Tesla", price: "248.10", change: "-1.22%", up: false, sparkline: spark(354), marketCap: "790 B" },
  { symbol: "MSFT", name: "Microsoft", price: "428.90", change: "+0.35%", up: true, sparkline: spark(365), marketCap: "2.86 T" },
];

export const MARKET_STOCK_TRENDS = [
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc" },
  { symbol: "AMZN", name: "Amazon.com, Inc." },
  { symbol: "AVGO", name: "Broadcom Inc." },
  { symbol: "COIN", name: "Coinbase Global, Inc." },
  { symbol: "AAPL", name: "Apple Inc" },
  { symbol: "META", name: "Meta Platforms, Inc." },
  { symbol: "MU", name: "Micron Technology, Inc." },
];

export const MARKET_HIGH_VOLUME: MarketQuote[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: "142.80", change: "+2.14%", up: true, sparkline: spark(410), volume: "312.4 M" },
  { symbol: "MU", name: "Micron Technology, Inc.", price: "118.20", change: "+3.41%", up: true, sparkline: spark(421), volume: "98.2 M" },
  { symbol: "META", name: "Meta Platforms, Inc.", price: "582.40", change: "+0.92%", up: true, sparkline: spark(432), volume: "21.6 M" },
  { symbol: "TSLA", name: "Tesla, Inc.", price: "248.10", change: "-1.22%", up: false, sparkline: spark(443), volume: "86.1 M" },
  { symbol: "AMD", name: "Advanced Micro Devices", price: "164.80", change: "+1.58%", up: true, sparkline: spark(454), volume: "54.3 M" },
  { symbol: "AAPL", name: "Apple Inc.", price: "228.40", change: "+0.62%", up: true, sparkline: spark(465), volume: "48.9 M" },
];

export const MARKET_GAINERS: MarketQuote[] = [
  { symbol: "SOXL", name: "Direxion Semi Bull 3X", price: "38.42", change: "+8.64%", up: true, sparkline: spark(510) },
  { symbol: "MU", name: "Micron Technology", price: "118.20", change: "+3.41%", up: true, sparkline: spark(521) },
  { symbol: "NVDA", name: "NVIDIA", price: "142.80", change: "+2.14%", up: true, sparkline: spark(532) },
  { symbol: "AMD", name: "AMD", price: "164.80", change: "+1.58%", up: true, sparkline: spark(543) },
  { symbol: "AVGO", name: "Broadcom", price: "248.60", change: "+1.42%", up: true, sparkline: spark(554) },
  { symbol: "SMH", name: "VanEck Semiconductor", price: "268.10", change: "+1.28%", up: true, sparkline: spark(565) },
];

export const MARKET_LOSERS: MarketQuote[] = [
  { symbol: "TSLA", name: "Tesla", price: "248.10", change: "-1.22%", up: false, sparkline: spark(610) },
  { symbol: "NFLX", name: "Netflix", price: "912.40", change: "-0.88%", up: false, sparkline: spark(621) },
  { symbol: "BA", name: "Boeing", price: "178.20", change: "-0.74%", up: false, sparkline: spark(632) },
  { symbol: "DIS", name: "Disney", price: "112.80", change: "-0.61%", up: false, sparkline: spark(643) },
  { symbol: "PYPL", name: "PayPal", price: "74.20", change: "-0.52%", up: false, sparkline: spark(654) },
  { symbol: "INTC", name: "Intel", price: "22.40", change: "-0.48%", up: false, sparkline: spark(665) },
];

export const MARKET_FEATURED_CRYPTO: MarketQuote[] = [
  { symbol: "BTCUSD", name: "Bitcoin", price: "68,420", change: "-0.34%", up: false, sparkline: spark(710, 24, 1), marketCap: "1.26 T" },
  { symbol: "ETHUSD", name: "Ethereum", price: "3,612.40", change: "+1.04%", up: true, sparkline: spark(721, 24, 0.9), marketCap: "214.5 B" },
  { symbol: "USDTUSD", name: "Tether", price: "1.0001", change: "+0.01%", up: true, sparkline: spark(732), marketCap: "184.2 B" },
  { symbol: "BNBUSD", name: "BNB", price: "592.10", change: "+0.67%", up: true, sparkline: spark(743), marketCap: "76.6 B" },
  { symbol: "USDCUSD", name: "USD Coin", price: "1.0000", change: "0.00%", up: true, sparkline: spark(754), marketCap: "73.4 B" },
  { symbol: "XRPUSD", name: "XRP", price: "0.6241", change: "-0.81%", up: false, sparkline: spark(765), marketCap: "67.3 B" },
];

export const MARKET_CRYPTO_RANKING: MarketQuote[] = [
  { symbol: "BTCUSD", name: "Bitcoin", price: "68,420", change: "-0.34%", up: false, sparkline: spark(810), marketCap: "1.26 T" },
  { symbol: "ETHUSD", name: "Ethereum", price: "3,612.40", change: "+1.04%", up: true, sparkline: spark(821), marketCap: "214.52 B" },
  { symbol: "USDTUSD", name: "Tether USDt", price: "1.0001", change: "+0.01%", up: true, sparkline: spark(832), marketCap: "184.15 B" },
  { symbol: "BNBUSD", name: "BNB", price: "592.10", change: "+0.67%", up: true, sparkline: spark(843), marketCap: "76.62 B" },
  { symbol: "USDCUSD", name: "USDC", price: "1.0000", change: "0.00%", up: true, sparkline: spark(854), marketCap: "73.37 B" },
  { symbol: "XRPUSD", name: "XRP", price: "0.6241", change: "-0.81%", up: false, sparkline: spark(865), marketCap: "67.30 B" },
];

export const MARKET_CRYPTO_GAINERS: MarketQuote[] = [
  { symbol: "SOLUSD", name: "Solana", price: "148.62", change: "+2.18%", up: true, sparkline: spark(910) },
  { symbol: "ETHUSD", name: "Ethereum", price: "3,612.40", change: "+1.04%", up: true, sparkline: spark(921) },
  { symbol: "BNBUSD", name: "BNB", price: "592.10", change: "+0.67%", up: true, sparkline: spark(932) },
  { symbol: "ADAUSD", name: "Cardano", price: "0.4512", change: "+0.29%", up: true, sparkline: spark(943) },
];

export const MARKET_CRYPTO_LOSERS: MarketQuote[] = [
  { symbol: "XRPUSD", name: "XRP", price: "0.6241", change: "-0.81%", up: false, sparkline: spark(950) },
  { symbol: "DOGEUSD", name: "Dogecoin", price: "0.1428", change: "-0.62%", up: false, sparkline: spark(961) },
  { symbol: "BTCUSD", name: "Bitcoin", price: "68,420", change: "-0.34%", up: false, sparkline: spark(972) },
  { symbol: "AVAXUSD", name: "Avalanche", price: "28.40", change: "-0.28%", up: false, sparkline: spark(983) },
];

export const MARKET_FEATURED_FUTURES: MarketQuote[] = [
  { symbol: "GC1!", name: "Gold", price: "2,418.30", change: "+0.58%", up: true, sparkline: spark(1010) },
  { symbol: "SI1!", name: "Silver", price: "31.42", change: "+0.91%", up: true, sparkline: spark(1021) },
  { symbol: "HG1!", name: "Copper", price: "4.521", change: "-0.22%", up: false, sparkline: spark(1032) },
  { symbol: "PL1!", name: "Platinum", price: "978.40", change: "+0.14%", up: true, sparkline: spark(1043) },
  { symbol: "CL1!", name: "Light crude oil", price: "81.26", change: "-0.52%", up: false, sparkline: spark(1054) },
  { symbol: "NG1!", name: "Natural gas", price: "2.84", change: "+1.12%", up: true, sparkline: spark(1065) },
];

export const MARKET_ENERGY: MarketQuote[] = [
  { symbol: "CL1!", name: "Light crude oil", price: "81.26", change: "-0.52%", up: false, sparkline: spark(1110) },
  { symbol: "NG1!", name: "Natural gas", price: "2.84", change: "+1.12%", up: true, sparkline: spark(1121) },
  { symbol: "BRN1!", name: "Brent crude oil", price: "84.10", change: "-0.38%", up: false, sparkline: spark(1132) },
  { symbol: "RB1!", name: "RBOB gasoline", price: "2.412", change: "+0.24%", up: true, sparkline: spark(1143) },
  { symbol: "HO1!", name: "NY Harbor ULSD", price: "2.518", change: "-0.18%", up: false, sparkline: spark(1154) },
  { symbol: "AEZ1!", name: "NY ethanol", price: "1.842", change: "+0.41%", up: true, sparkline: spark(1165) },
];

export const MARKET_METALS_FUTURES: MarketQuote[] = [
  { symbol: "GC1!", name: "Gold", price: "2,418.30", change: "+0.58%", up: true, sparkline: spark(1210) },
  { symbol: "SI1!", name: "Silver", price: "31.42", change: "+0.91%", up: true, sparkline: spark(1221) },
  { symbol: "PL1!", name: "Platinum", price: "978.40", change: "+0.14%", up: true, sparkline: spark(1232) },
  { symbol: "HG1!", name: "Copper", price: "4.521", change: "-0.22%", up: false, sparkline: spark(1243) },
  { symbol: "PA1!", name: "Palladium", price: "982.10", change: "-0.46%", up: false, sparkline: spark(1254) },
  { symbol: "ALI1!", name: "Aluminum", price: "2,512", change: "+0.18%", up: true, sparkline: spark(1265) },
];

export const MARKET_FEATURED_FOREX: MarketQuote[] = [
  { symbol: "EURUSD", name: "EUR to USD", price: "1.0842", change: "+0.12%", up: true, sparkline: spark(1310) },
  { symbol: "USDJPY", name: "JPY to USD", price: "151.24", change: "-0.18%", up: false, sparkline: spark(1321) },
  { symbol: "GBPUSD", name: "GBP to USD", price: "1.2741", change: "-0.08%", up: false, sparkline: spark(1332) },
  { symbol: "USDCHF", name: "CHF to USD", price: "0.8842", change: "+0.06%", up: true, sparkline: spark(1343) },
  { symbol: "AUDUSD", name: "AUD to USD", price: "0.6624", change: "+0.21%", up: true, sparkline: spark(1354) },
  { symbol: "NZDUSD", name: "NZD to USD", price: "0.6012", change: "+0.14%", up: true, sparkline: spark(1365) },
];

export const MARKET_FOREX_MAJORS: MarketQuote[] = [
  { symbol: "EURUSD", name: "EUR to USD", price: "1.0842", change: "+0.12%", up: true, sparkline: spark(1410) },
  { symbol: "USDJPY", name: "USD to JPY", price: "151.24", change: "-0.18%", up: false, sparkline: spark(1421) },
  { symbol: "GBPUSD", name: "GBP to USD", price: "1.2741", change: "-0.08%", up: false, sparkline: spark(1432) },
  { symbol: "AUDUSD", name: "AUD to USD", price: "0.6624", change: "+0.21%", up: true, sparkline: spark(1443) },
  { symbol: "USDCAD", name: "USD to CAD", price: "1.3642", change: "+0.05%", up: true, sparkline: spark(1454) },
  { symbol: "USDCHF", name: "USD to CHF", price: "0.8842", change: "+0.06%", up: true, sparkline: spark(1465) },
];

/** @deprecated kept for any legacy imports */
export const MARKET_INDICES = MARKET_FEATURED_INDICES;
export const MARKET_CRYPTO = MARKET_FEATURED_CRYPTO;
export const MARKET_METALS = MARKET_METALS_FUTURES;

export const MARKET_INSIGHTS: MarketInsight[] = [
  {
    id: "1",
    title: "BTC holding structure near demand — watch the weekly close",
    symbol: "BTCUSD",
    author: "Velion Research",
    bias: "long",
    snippet: "Price is reacting from a higher-timeframe demand zone with improving momentum confluence.",
    href: "/trading-signals",
  },
  {
    id: "2",
    title: "EUR/USD compression into key resistance",
    symbol: "EURUSD",
    author: "Desk Analytics",
    bias: "short",
    snippet: "Range compression often precedes expansion. Rejection at 1.0900 keeps downside scenarios active.",
    href: "/trading-signals",
  },
  {
    id: "3",
    title: "Gold momentum remains constructive above support",
    symbol: "XAUUSD",
    author: "Velion Research",
    bias: "long",
    snippet: "As long as weekly structure holds, pullbacks remain buyable for trend-following allocations.",
    href: "/trading-signals",
  },
  {
    id: "4",
    title: "Nasdaq leadership intact — selective tech exposure",
    symbol: "NDX",
    author: "Market Desk",
    bias: "long",
    snippet: "Breadth is mixed, but index leadership continues to favor high-quality growth names.",
    href: "/trading-room",
  },
  {
    id: "5",
    title: "ETH relative strength vs BTC on the 4H",
    symbol: "ETHUSD",
    author: "Crypto Desk",
    bias: "long",
    snippet: "Rotation into ETH pairs is showing cleaner impulse legs than the broader alt complex.",
    href: "/trading-signals",
  },
  {
    id: "6",
    title: "Oil range trade: fade extremes until breakout",
    symbol: "CL1!",
    author: "Commodities",
    bias: "neutral",
    snippet: "WTI remains range-bound. Wait for acceptance outside the recent balance before sizing up.",
    href: "/trading-room",
  },
];

export const HERO_CHART = [
  { v: 42 }, { v: 48 }, { v: 45 }, { v: 52 }, { v: 58 }, { v: 55 },
  { v: 62 }, { v: 68 }, { v: 65 }, { v: 72 }, { v: 78 }, { v: 85 },
  { v: 82 }, { v: 88 }, { v: 95 }, { v: 92 }, { v: 98 }, { v: 104 },
];

export const HERO_PAIRS = [
  { symbol: "BTC/USD", price: "68,420", change: "-0.34%", up: false },
  { symbol: "ETH/USD", price: "3,612", change: "+1.04%", up: true },
  { symbol: "EUR/USD", price: "1.0842", change: "+0.12%", up: true },
  { symbol: "XAU/USD", price: "2,418", change: "+0.58%", up: true },
] as const;
