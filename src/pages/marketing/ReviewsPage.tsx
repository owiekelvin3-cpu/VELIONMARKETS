import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { Container } from "@/components/ui/section";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { MARKET_INSIGHTS, MARKET_STOCK_TRENDS } from "@/constants/markets-demo";
import { IMAGES } from "@/constants/images";
import { Star } from "@/lib/icons";
import { cn } from "@/lib/utils";

const testimonials = [
  { name: "James Richardson", contentKey: "testimonials.t1", roleKey: "testimonials.r1", avatar: IMAGES.avatars.james },
  { name: "Sarah Mitchell", contentKey: "testimonials.t2", roleKey: "testimonials.r2", avatar: IMAGES.avatars.sarah },
  { name: "Michael Torres", contentKey: "testimonials.t3", roleKey: "testimonials.r3", avatar: IMAGES.avatars.michael },
  { name: "Emma Walsh", contentKey: "testimonials.t4", roleKey: "testimonials.r4", avatar: IMAGES.avatars.emma },
  { name: "David Harrison", contentKey: "testimonials.t5", roleKey: "testimonials.r5", avatar: IMAGES.avatars.david },
  { name: "Lisa Morgan", contentKey: "testimonials.t6", roleKey: "testimonials.r6", avatar: IMAGES.avatars.lisa },
] as const;

export default function ReviewsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("nav.community")}
        title={t("pages.reviewsTitle")}
        subtitle={t("pages.reviewsSubtitle")}
        cta={{ label: t("common.getStarted"), href: "/auth?mode=register" }}
      />

      <section className="pb-20 pt-10 md:pb-28">
        <Container>
          {/* Trending symbols — TradingView community trends */}
          <FadeIn className="mb-10">
            <h2 className="mb-4 font-display text-xl font-bold md:text-2xl">{t("pages.communityTrends")}</h2>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
              {MARKET_STOCK_TRENDS.map((item) => (
                <Link
                  key={item.symbol}
                  to="/trading-room"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary/25 px-3 py-1.5 transition-colors hover:border-emerald/30"
                >
                  <span className="font-mono text-xs font-semibold text-emerald">{item.symbol}</span>
                  <span className="max-w-[120px] truncate text-xs text-muted">{item.name}</span>
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* Editors' picks / ideas */}
          <FadeIn className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                {t("pages.communityIdeas")}
              </h2>
              <p className="mt-2 text-sm text-muted">{t("pages.communityIdeasSub")}</p>
            </div>
            <Link to="/trading-signals" className="hidden text-sm font-semibold text-emerald hover:underline sm:inline">
              {t("pages.signalsSeeAll")}
            </Link>
          </FadeIn>

          <StaggerContainer className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKET_INSIGHTS.map((idea) => (
              <StaggerItem key={idea.id}>
                <Link
                  to={idea.href}
                  className="group flex h-full flex-col rounded-2xl border border-border p-5 transition-colors hover:border-emerald/30 hover:bg-emerald/[0.04]"
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
                  <h3 className="font-display text-base font-semibold leading-snug group-hover:text-emerald">
                    {idea.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{idea.snippet}</p>
                  <p className="mt-4 text-xs text-muted">
                    {t("insights.by")} {idea.author}
                  </p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Member reviews — lighter than glass cards */}
          <FadeIn className="mb-5">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("pages.communityReviews")}
            </h2>
            <p className="mt-2 text-sm text-muted">{t("pages.communityReviewsSub")}</p>
          </FadeIn>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((item) => (
              <StaggerItem key={item.name}>
                <article className="h-full rounded-2xl border border-border p-5 md:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover object-top ring-1 ring-border"
                    />
                    <div>
                      <p className="font-display text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">{t(item.roleKey)}</p>
                    </div>
                  </div>
                  <div className="mb-3 flex gap-0.5" aria-label={t("pages.reviewsStars", { count: 5 })}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-emerald text-emerald" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-muted">&ldquo;{t(item.contentKey)}&rdquo;</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Container>
      </section>
    </>
  );
}
