import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { MarketsSubnav } from "@/components/marketing/MarketsSubnav";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import {
  BROKER_FILTERS,
  BROKER_HERO_STAT,
  VELION_BROKER,
  VELION_OFFERINGS,
  type BrokerAssetFilter,
  type BrokerCard,
} from "@/constants/brokers-demo";
import { Star } from "@/lib/icons";
import { cn } from "@/lib/utils";

function assetLabels(card: BrokerCard, t: (k: string) => string) {
  return card.assets
    .map((a) => {
      const found = BROKER_FILTERS.find((f) => f.id === a);
      return found ? t(found.labelKey) : a;
    })
    .join(", ");
}

function BrokerCardView({ card, featured }: { card: BrokerCard; featured?: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border p-5 transition-colors hover:border-emerald/30",
        featured && "bg-emerald/[0.04] ring-1 ring-emerald/20"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-bold">{card.name}</h3>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            card.tier === "platinum" ? "bg-emerald/15 text-emerald" : "bg-amber-500/15 text-amber-400"
          )}
        >
          {t(card.tier === "platinum" ? "brokersPage.platinum" : "brokersPage.gold")}
        </span>
        {card.badge && (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted">
            {t("brokersPage.featured")}
          </span>
        )}
      </div>

      <p className="text-sm text-muted">{card.description}</p>
      <p className="mt-3 text-xs text-muted">
        {t("brokersPage.tradableAssets")}: <span className="text-foreground">{assetLabels(card, t)}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
          <Star className="h-3.5 w-3.5 text-emerald" aria-hidden="true" />
          {card.rating.toFixed(1)}
          <span className="font-normal text-muted">{card.ratingLabel}</span>
        </span>
        <span className="text-xs text-muted">
          {card.reviews} {t("brokersPage.reviews")}
        </span>
        <span className="text-xs text-muted">
          {card.accounts} {t("brokersPage.accounts")}
        </span>
      </div>

      {card.promo && (
        <p className="mt-3 rounded-lg border border-emerald/20 bg-emerald/5 px-3 py-2 text-xs font-medium text-emerald">
          {card.promo}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/auth?mode=register">{t("brokersPage.openAccount")}</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/services">{t("brokersPage.learnMore")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function BrokersPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<BrokerAssetFilter>("all");

  const cards = useMemo(() => {
    const all = [VELION_BROKER, ...VELION_OFFERINGS];
    if (filter === "all") return all;
    return all.filter((c) => c.assets.includes(filter));
  }, [filter]);

  return (
    <>
      <PageHero
        badge={t("brokersPage.badge")}
        title={t("brokersPage.title")}
        subtitle={t("brokersPage.subtitle")}
        align="center"
        cta={{ label: t("brokersPage.openAccount"), href: "/auth?mode=register" }}
      >
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            {BROKER_HERO_STAT.orders}
          </p>
          <p className="mt-2 text-sm text-muted">{t(BROKER_HERO_STAT.labelKey)}</p>
        </div>
      </PageHero>

      <section className="pb-20 pt-6 md:pb-28">
        <Container>
          <MarketsSubnav />

          <FadeIn className="mb-8 -mx-1 overflow-x-auto px-1 scrollbar-none">
            <div className="flex min-w-max gap-2">
              {BROKER_FILTERS.map((item) => (
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
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </FadeIn>

          <StaggerContainer className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <StaggerItem key={card.id}>
                <BrokerCardView card={card} featured={card.featured} />
              </StaggerItem>
            ))}
          </StaggerContainer>

          {cards.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">{t("brokersPage.empty")}</p>
          )}
        </Container>
      </section>
    </>
  );
}
