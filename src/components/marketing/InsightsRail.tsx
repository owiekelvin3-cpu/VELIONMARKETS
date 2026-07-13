import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "@/lib/icons";
import { MARKET_INSIGHTS } from "@/constants/markets-demo";
import { FadeIn } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

export function InsightsRail() {
  const { t } = useTranslation();

  return (
    <Section>
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow={t("insights.eyebrow")}
            title={t("insights.title")}
            subtitle={t("insights.subtitle")}
            align="left"
            className="mb-0"
          />
          <Link
            to="/trading-signals"
            className="inline-flex shrink-0 items-center text-sm font-semibold text-emerald hover:underline"
          >
            {t("insights.seeAll")} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <FadeIn>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-thin sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {MARKET_INSIGHTS.map((idea) => (
              <Link
                key={idea.id}
                to={idea.href}
                className="group min-w-[280px] shrink-0 rounded-2xl border border-border bg-charcoal/30 p-5 transition-colors hover:border-emerald/30 hover:bg-emerald/[0.04] sm:min-w-0"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold">
                    {idea.symbol}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      idea.bias === "long" && "bg-emerald/15 text-market-up",
                      idea.bias === "short" && "bg-red-500/15 text-market-down",
                      idea.bias === "neutral" && "bg-secondary text-muted"
                    )}
                  >
                    {t(`insights.bias.${idea.bias}`)}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold leading-snug text-foreground group-hover:text-emerald">
                  {idea.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{idea.snippet}</p>
                <p className="mt-4 text-xs text-muted">
                  {t("insights.by")} {idea.author}
                </p>
              </Link>
            ))}
          </div>
        </FadeIn>
      </Container>
    </Section>
  );
}
