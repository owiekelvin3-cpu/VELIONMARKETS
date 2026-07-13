import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { MarketsSubnav } from "@/components/marketing/MarketsSubnav";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/Motion";
import { FOREX_NEWS } from "@/constants/economy-demo";
import { cn } from "@/lib/utils";

type Filter = "all" | "top";

export default function ForexNewsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(
    () => (filter === "top" ? FOREX_NEWS.filter((n) => n.top) : FOREX_NEWS),
    [filter]
  );

  return (
    <>
      <PageHero
        badge={t("forexNews.badge")}
        title={t("forexNews.title")}
        subtitle={t("forexNews.subtitle")}
        cta={{ label: t("forexNews.cta"), href: "/trading-room" }}
      />

      <section className="pb-20 pt-6 md:pb-28">
        <Container>
          <MarketsSubnav />

          <FadeIn className="mb-6 flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all" as const, label: t("forexNews.filterAll") },
                { id: "top" as const, label: t("forexNews.filterTop") },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                  filter === item.id
                    ? "border-emerald/40 bg-emerald/10 text-emerald"
                    : "border-border text-muted hover:border-emerald/30 hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
            <Link to="/world-economy" className="ml-auto text-xs font-semibold text-emerald hover:underline sm:text-sm">
              {t("forexNews.moreFlow")}
            </Link>
          </FadeIn>

          <FadeIn>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="hidden grid-cols-[72px_100px_1fr_120px] gap-3 border-b border-border bg-secondary/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted sm:grid">
                <span>{t("forexNews.time")}</span>
                <span>{t("forexNews.instrument")}</span>
                <span>{t("forexNews.headline")}</span>
                <span className="text-right">{t("forexNews.provider")}</span>
              </div>
              {rows.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-1 border-b border-border/50 px-4 py-3.5 last:border-0 sm:grid-cols-[72px_100px_1fr_120px] sm:items-center sm:gap-3"
                >
                  <time className="font-mono text-xs text-muted">{item.time}</time>
                  <span className="w-fit rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald">
                    {item.instrument}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium leading-snug text-foreground">{item.headline}</h3>
                    {item.top && (
                      <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wide text-emerald">
                        {t("forexNews.topStory")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted sm:text-right">{item.provider}</p>
                </article>
              ))}
            </div>
          </FadeIn>

          <FadeIn className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-charcoal/40 p-6">
            <div>
              <p className="font-display text-lg font-bold">{t("forexNews.tradeTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("forexNews.tradeSub")}</p>
            </div>
            <Button asChild>
              <Link to="/trading-room">{t("forexNews.cta")}</Link>
            </Button>
          </FadeIn>
        </Container>
      </section>
    </>
  );
}
