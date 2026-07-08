import { TrendingUp, TrendingDown } from "@/lib/icons";

const tickers = [
  { symbol: "EUR/USD", price: "1.0842", change: "+0.12%", up: true },
  { symbol: "BTC/USD", price: "68,420", change: "-0.34%", up: false },
  { symbol: "XAU/USD", price: "2,418.30", change: "+0.58%", up: true },
  { symbol: "S&P 500", price: "5,634.20", change: "+0.21%", up: true },
  { symbol: "ETH/USD", price: "3,612.40", change: "+1.04%", up: true },
  { symbol: "GBP/USD", price: "1.2741", change: "-0.08%", up: false },
];

export function MarketTicker() {
  const items = [...tickers, ...tickers];

  return (
    <div
      className="overflow-hidden border-y border-white/8 py-3.5"
      style={{ background: "linear-gradient(90deg, rgba(17,17,17,0.95) 0%, rgba(15,23,42,0.4) 50%, rgba(17,17,17,0.95) 100%)" }}
      aria-label="Live market prices"
    >
      <div className="flex animate-marquee whitespace-nowrap will-change-transform">
        {items.map((t, i) => (
          <div key={i} className="mx-10 flex items-center gap-3 text-sm">
            <span className="font-semibold text-foreground/90">{t.symbol}</span>
            <span className="font-mono text-muted">{t.price}</span>
            <span className={`flex items-center gap-1 font-medium ${t.up ? "text-emerald" : "text-red-400"}`}>
              {t.up ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
              {t.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
