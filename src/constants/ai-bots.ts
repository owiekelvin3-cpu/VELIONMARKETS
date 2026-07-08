export interface AIBot {
  id: string;
  name: string;
  description: string;
  winRate: number;
  monthlyReturn: string;
  hourlyReturn: string;
  risk: "low" | "medium" | "high";
  markets: string[];
  minPower: number;
  accent: string;
}

export const AI_BOTS: AIBot[] = [
  {
    id: "nexus",
    name: "Nexus AI",
    description: "Steady crypto scanner with conservative entries. Best for longer runs and consistent hourly gains.",
    winRate: 100,
    monthlyReturn: "+18.4%",
    hourlyReturn: "+0.35%/hr",
    risk: "low",
    markets: ["BTC", "ETH", "SOL"],
    minPower: 250,
    accent: "#10b981",
  },
  {
    id: "quantum",
    name: "Quantum Flow",
    description: "Balanced multi-coin engine. Higher power unlocks faster compounding across major crypto pairs.",
    winRate: 100,
    monthlyReturn: "+31.2%",
    hourlyReturn: "+0.55%/hr",
    risk: "medium",
    markets: ["BTC", "ETH", "BNB", "XRP"],
    minPower: 500,
    accent: "#6366f1",
  },
  {
    id: "apex",
    name: "Apex Neural",
    description: "Maximum power multiplier. Aggressive crypto momentum — highest profit per dollar of bot power.",
    winRate: 100,
    monthlyReturn: "+47.8%",
    hourlyReturn: "+0.85%/hr",
    risk: "high",
    markets: ["BTC", "ETH", "SOL", "DOGE"],
    minPower: 1000,
    accent: "#f59e0b",
  },
];

export const BOT_DURATIONS = [
  { hours: 6, label: "6 hours" },
  { hours: 12, label: "12 hours" },
  { hours: 24, label: "24 hours" },
  { hours: 48, label: "48 hours" },
  { hours: 72, label: "72 hours" },
  { hours: 168, label: "7 days" },
] as const;

export const CRYPTO_ASSETS = [
  { id: "BTC", label: "Bitcoin", pair: "BTC/USDT" },
  { id: "ETH", label: "Ethereum", pair: "ETH/USDT" },
  { id: "SOL", label: "Solana", pair: "SOL/USDT" },
  { id: "BNB", label: "BNB", pair: "BNB/USDT" },
  { id: "XRP", label: "XRP", pair: "XRP/USDT" },
  { id: "DOGE", label: "Dogecoin", pair: "DOGE/USDT" },
] as const;

export const LIVE_SIGNALS = [
  { bot: "Nexus AI", asset: "BTC/USDT", action: "Long signal — accumulation zone confirmed", confidence: 96 },
  { bot: "Quantum Flow", asset: "ETH/USDT", action: "Momentum breakout — profit target locked", confidence: 94 },
  { bot: "Apex Neural", asset: "SOL/USDT", action: "Scalp complete — +3.2% on power allocation", confidence: 98 },
  { bot: "Nexus AI", asset: "ETH/USDT", action: "RSI reversal — automated buy executed", confidence: 92 },
  { bot: "Quantum Flow", asset: "BNB/USDT", action: "Order flow bullish — trade closed in profit", confidence: 95 },
  { bot: "Apex Neural", asset: "DOGE/USDT", action: "Volatility spike captured — profit secured", confidence: 97 },
];
