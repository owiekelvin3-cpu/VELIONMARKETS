import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { FadeIn } from "@/components/motion/Motion";
import { Container } from "@/components/ui/section";
import {
  MARKET_CRYPTO_GAINERS,
  MARKET_CRYPTO_LOSERS,
  MARKET_CRYPTO_RANKING,
  MARKET_ENERGY,
  MARKET_FEATURED_CRYPTO,
  MARKET_FEATURED_FOREX,
  MARKET_FEATURED_FUTURES,
  MARKET_FEATURED_INDICES,
  MARKET_FEATURED_STOCKS,
  MARKET_FOREX_MAJORS,
  MARKET_GAINERS,
  MARKET_HIGH_VOLUME,
  MARKET_LOSERS,
  MARKET_METALS_FUTURES,
  MARKET_STOCK_TRENDS,
  MARKET_WORLD_INDICES,
  type MarketQuote,
} from "@/constants/markets-demo";
import { cn } from "@/lib/utils";

function MiniSpark({ quote, wide = false }: { quote: MarketQuote; wide?: boolean }) {
  const id = `tv-spark-${quote.symbol.replace(/[^a-zA-Z0-9]/g, "")}-${wide ? "w" : "n"}`;
  const data = quote.sparkline.map((v) => ({ v }));
  const color = quote.up ? "#10b981" : "#f87171";

  return (
    <div className={cn("h-10", wide ? "w-full min-w-[96px]" : "w-20 sm:w-24")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function FeaturedCard({ quote }: { quote: MarketQuote }) {
  return (
    <Link
      to="/trading-room"
      className="group min-w-[168px] shrink-0 rounded-xl border border-border bg-charcoal/40 p-3.5 transition-colors hover:border-emerald/30 hover:bg-emerald/[0.04] sm:min-w-0"
    >
      <p className="truncate text-sm font-semibold text-foreground group-hover:text-emerald">{quote.name}</p>
      <p className="mt-0.5 font-mono text-[11px] text-muted">{quote.symbol}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-medium text-foreground">{quote.price}</p>
          <p className={cn("mt-0.5 text-xs font-medium", quote.up ? "text-market-up" : "text-market-down")}>
            {quote.change}
          </p>
        </div>
        <MiniSpark quote={quote} />
      </div>
    </Link>
  );
}

function QuoteTable({
  rows,
  showCap = false,
  showVolume = false,
}: {
  rows: MarketQuote[];
  showCap?: boolean;
  showVolume?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className={cn(
          "grid gap-2 border-b border-border bg-secondary/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted sm:px-4",
          showCap || showVolume
            ? "grid-cols-[1.4fr_0.9fr_0.8fr_72px]"
            : "grid-cols-[1.4fr_0.9fr_0.8fr_72px]"
        )}
      >
        <span>{t("markets.symbol")}</span>
        <span className="text-right">{t("markets.priceChg")}</span>
        <span className="text-right">
          {showCap ? t("markets.marketCap") : showVolume ? t("markets.volume") : t("markets.change")}
        </span>
        <span className="text-right">{t("markets.trend")}</span>
      </div>
      <div>
        {rows.map((row) => (
          <Link
            key={row.symbol}
            to="/trading-room"
            className="grid grid-cols-[1.4fr_0.9fr_0.8fr_72px] items-center gap-2 border-b border-border/50 px-3 py-2.5 last:border-0 transition-colors hover:bg-secondary/30 sm:px-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.symbol}</p>
              <p className="truncate text-[11px] text-muted">{row.name}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-foreground sm:text-sm">{row.price}</p>
              <p className={cn("text-[11px] font-medium", row.up ? "text-market-up" : "text-market-down")}>
                {row.change}
              </p>
            </div>
            <p className="text-right font-mono text-xs text-muted sm:text-sm">
              {showCap ? row.marketCap ?? "—" : showVolume ? row.volume ?? "—" : row.change}
            </p>
            <div className="justify-self-end">
              <MiniSpark quote={row} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function TrendChips({ items }: { items: { symbol: string; name: string }[] }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
      {items.map((item) => (
        <Link
          key={item.symbol}
          to="/trading-room"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 transition-colors hover:border-emerald/30 hover:bg-emerald/[0.06]"
        >
          <span className="font-mono text-xs font-semibold text-emerald">{item.symbol}</span>
          <span className="max-w-[140px] truncate text-xs text-muted">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}

function SectionBlock({
  id,
  title,
  featured,
  children,
}: {
  id?: string;
  title: string;
  featured?: MarketQuote[];
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <section id={id} className="scroll-mt-24 border-t border-border/70 pt-10 md:pt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
        <Link to="/trading-room" className="shrink-0 text-xs font-semibold text-emerald hover:underline md:text-sm">
          {t("markets.launchChart")}
        </Link>
      </div>
      {featured && featured.length > 0 && (
        <div className="-mx-1 mb-6 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {featured.map((q) => (
            <FeaturedCard key={q.symbol} quote={q} />
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

function SubPanel({
  title,
  seeAll,
  children,
  className,
}: {
  title: string;
  seeAll?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground md:text-base">{title}</h3>
        {seeAll && (
          <Link to="/trading-room" className="text-[11px] font-semibold text-emerald hover:underline sm:text-xs">
            {seeAll}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export function MarketSummary() {
  const { t } = useTranslation();

  return (
    <div id="markets" className="relative scroll-mt-20 border-t border-border bg-void/40 py-12 md:py-16">
      <Container>
        <FadeIn className="mb-10 md:mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">{t("markets.eyebrow")}</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[3.5rem]">
            {t("markets.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted md:text-base">{t("markets.subtitle")}</p>
        </FadeIn>

        {/* Indices — TradingView Markets layout */}
        <SectionBlock title={t("markets.indices")} featured={MARKET_FEATURED_INDICES}>
          <SubPanel title={t("markets.worldIndices")} seeAll={t("markets.seeAllIndices")}>
            <QuoteTable rows={MARKET_WORLD_INDICES} />
          </SubPanel>
        </SectionBlock>

        {/* US stocks */}
        <SectionBlock title={t("markets.usStocks")} featured={MARKET_FEATURED_STOCKS}>
          <SubPanel title={t("markets.communityTrends")} className="mb-8">
            <TrendChips items={MARKET_STOCK_TRENDS} />
          </SubPanel>

          <div className="grid gap-8 lg:grid-cols-2">
            <SubPanel title={t("markets.highestVolume")} seeAll={t("markets.seeAllVolume")}>
              <QuoteTable rows={MARKET_HIGH_VOLUME} showVolume />
            </SubPanel>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SubPanel title={t("markets.gainers")} seeAll={t("markets.seeAllGainers")}>
                <QuoteTable rows={MARKET_GAINERS} />
              </SubPanel>
              <SubPanel title={t("markets.losers")} seeAll={t("markets.seeAllLosers")}>
                <QuoteTable rows={MARKET_LOSERS} />
              </SubPanel>
            </div>
          </div>
        </SectionBlock>

        {/* Crypto */}
        <SectionBlock title={t("markets.crypto")} featured={MARKET_FEATURED_CRYPTO}>
          <div className="grid gap-8 lg:grid-cols-2">
            <SubPanel title={t("markets.cryptoRanking")} seeAll={t("markets.seeAllCoins")}>
              <QuoteTable rows={MARKET_CRYPTO_RANKING} showCap />
            </SubPanel>
            <div className="grid gap-8 sm:grid-cols-2">
              <SubPanel title={t("markets.cryptoGainers")}>
                <QuoteTable rows={MARKET_CRYPTO_GAINERS} />
              </SubPanel>
              <SubPanel title={t("markets.cryptoLosers")}>
                <QuoteTable rows={MARKET_CRYPTO_LOSERS} />
              </SubPanel>
            </div>
          </div>
        </SectionBlock>

        {/* Futures */}
        <SectionBlock title={t("markets.futures")} featured={MARKET_FEATURED_FUTURES}>
          <div className="grid gap-8 lg:grid-cols-2">
            <SubPanel title={t("markets.energy")} seeAll={t("markets.seeAllEnergy")}>
              <QuoteTable rows={MARKET_ENERGY} />
            </SubPanel>
            <SubPanel title={t("markets.metalsFutures")} seeAll={t("markets.seeAllMetals")}>
              <QuoteTable rows={MARKET_METALS_FUTURES} />
            </SubPanel>
          </div>
        </SectionBlock>

        {/* Forex */}
        <SectionBlock title={t("markets.forex")} featured={MARKET_FEATURED_FOREX}>
          <SubPanel title={t("markets.majors")} seeAll={t("markets.seeAllForex")}>
            <QuoteTable rows={MARKET_FOREX_MAJORS} />
          </SubPanel>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <Link to="/world-economy" className="font-semibold text-emerald hover:underline">
              {t("markets.worldEconomy")}
            </Link>
            <Link to="/forex-news" className="font-semibold text-emerald hover:underline">
              {t("markets.forexNews")}
            </Link>
            <Link to="/world-economy/trends" className="font-semibold text-muted hover:text-emerald hover:underline">
              {t("markets.globalTrends")}
            </Link>
          </div>
        </SectionBlock>
      </Container>
    </div>
  );
}
