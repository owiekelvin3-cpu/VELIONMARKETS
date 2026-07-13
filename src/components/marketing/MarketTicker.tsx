import { useTranslation } from "react-i18next";
import { MARKET_TICKER } from "@/constants/markets-demo";
import { TrendingUp, TrendingDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function MarketTicker() {
  const { t } = useTranslation();
  const items = [...MARKET_TICKER, ...MARKET_TICKER];

  return (
    <div
      className="overflow-hidden border-y border-border bg-charcoal/60"
      aria-label={t("pages.marketPrices")}
    >
      <div className="flex animate-marquee whitespace-nowrap will-change-transform py-2.5">
        {items.map((q, i) => (
          <div key={`${q.symbol}-${i}`} className="mx-6 flex items-center gap-3 text-sm sm:mx-8">
            <span className="font-semibold text-foreground">{q.symbol}</span>
            <span className="font-mono text-muted">{q.price}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                q.up ? "text-market-up" : "text-market-down"
              )}
            >
              {q.up ? (
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3" aria-hidden="true" />
              )}
              {q.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
