import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/Motion";
import {
  articlesToIdeas,
  buildPageList,
  COMMUNITY_PAGE_SIZE,
  fetchCommunityArticles,
  formatArticleTime,
  type CommunityIdea,
  type CommunityTopic,
  type IdeaBias,
} from "@/lib/community-feed";
import { ArrowLeft, ArrowRight, RefreshCw } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Tab = "popular" | "editors";
type Sort = "recent" | "popular";

const FILTERS: CommunityTopic[] = ["all", "crypto", "finance", "markets"];

function BiasBadge({ bias }: { bias: IdeaBias }) {
  const { t } = useTranslation();
  if (bias === "neutral") return null;
  if (bias === "education") {
    return (
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-secondary text-muted">
        {t("pages.ideasEducation")}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        bias === "long" && "bg-emerald/15 text-market-up",
        bias === "short" && "bg-red-500/15 text-market-down"
      )}
    >
      {t(`insights.bias.${bias}`)}
    </span>
  );
}

function IdeaCard({ idea }: { idea: CommunityIdea }) {
  const { t, i18n } = useTranslation();
  const biasLabel =
    idea.bias === "long" ? "long" : idea.bias === "short" ? "short" : idea.bias === "education" ? "education" : null;

  if (!idea.image) return null;

  return (
    <a
      href={idea.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-void/20 transition-colors hover:border-emerald/35"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/50">
        <img
          src={idea.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-3">
          <span className="rounded bg-black/55 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur-sm">
            {idea.symbol}
          </span>
          {biasLabel && biasLabel !== "education" ? (
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                biasLabel === "long" ? "bg-emerald/80" : "bg-red-500/80"
              )}
            >
              {t(`insights.bias.${biasLabel}`)}
            </span>
          ) : biasLabel === "education" ? (
            <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {t("pages.ideasEducation")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-snug text-foreground group-hover:text-emerald">
          {idea.title}
        </h3>
        {idea.summary ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">{idea.summary}</p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <BiasBadge bias={idea.bias} />
          <span>
            {t("insights.by")}{" "}
            <span className="font-medium text-foreground/80">{idea.handle}</span>
          </span>
          {idea.updated ? (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald">
              {t("pages.ideasUpdated")}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[11px]">
            {formatArticleTime(idea.publishedAt, i18n.language)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted/80">{idea.source}</p>
      </div>
    </a>
  );
}

function IdeasPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  const items = buildPageList(page, totalPages);

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {t("pages.ideasShowMore")}
      </h2>
      <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label={t("pages.ideasPagination")}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t("pages.ideasPrev")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-emerald/40 hover:text-emerald disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </button>

        {items.map((item, idx) =>
          item === "ellipsis" ? (
            <span key={`e-${idx}`} className="px-1.5 text-sm text-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-semibold transition-colors",
                item === page
                  ? "bg-secondary text-foreground"
                  : "text-muted hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={t("pages.ideasNext")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-emerald/40 hover:text-emerald disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("popular");
  const [filter, setFilter] = useState<CommunityTopic>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [page, setPage] = useState(1);
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedDay, setFeedDay] = useState(() => new Date().toISOString().slice(0, 10));

  async function load(force = false) {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const articles = await fetchCommunityArticles(force);
      setIdeas(articlesToIdeas(articles).filter((i) => Boolean(i.image)));
      setFeedDay(new Date().toISOString().slice(0, 10));
      if (articles.length === 0) setError(t("pages.communityEmpty"));
    } catch {
      setError(t("pages.communityError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load(false);
    // Re-check hourly so a new calendar day pulls a fresh daily snapshot
    const id = window.setInterval(() => void load(false), 60 * 60 * 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, filter, sort]);

  const visible = useMemo(() => {
    let rows = ideas.filter((i) => Boolean(i.image));
    if (tab === "editors") {
      rows = rows.filter(
        (i) => i.source === "Cointelegraph" || i.source === "Decrypt" || i.topic === "crypto"
      );
      if (rows.length < 6) rows = ideas.filter((i) => Boolean(i.image));
    }
    if (filter !== "all") rows = rows.filter((i) => i.topic === filter);

    rows = [...rows].sort((a, b) => {
      if (sort === "popular") {
        const score = (x: CommunityIdea) =>
          (x.bias === "long" || x.bias === "short" ? 2 : 0) +
          (x.topic === "crypto" ? 1 : 0) -
          (Date.now() - +new Date(x.publishedAt)) / 86_400_000;
        return score(b) - score(a);
      }
      return +new Date(b.publishedAt) - +new Date(a.publishedAt);
    });

    return rows;
  }, [ideas, tab, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / COMMUNITY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = visible.slice((safePage - 1) * COMMUNITY_PAGE_SIZE, safePage * COMMUNITY_PAGE_SIZE);

  function goToPage(next: number) {
    const clamped = Math.max(1, Math.min(totalPages, next));
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="pb-20 pt-8 md:pb-28 md:pt-10">
      <Container>
        <FadeIn className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {t("pages.ideasTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted md:text-base">{t("pages.ideasSubtitle")}</p>
            <p className="mt-1 text-xs text-muted">{t("pages.ideasDailyNote", { date: feedDay })}</p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-emerald/40 hover:text-emerald disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
            {t("pages.communityRefresh")}
          </button>
        </FadeIn>

        <FadeIn className="mb-5 flex gap-1 border-b border-border">
          {(
            [
              { id: "popular" as const, label: t("pages.ideasTabPopular") },
              { id: "editors" as const, label: t("pages.ideasTabEditors") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative -mb-px px-4 py-2.5 text-sm font-semibold transition-colors",
                tab === item.id ? "text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {item.label}
              {tab === item.id ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald" />
              ) : null}
            </button>
          ))}
        </FadeIn>

        <FadeIn className="mb-6 flex flex-wrap items-center gap-2">
          {FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                filter === id
                  ? "border-emerald/40 bg-emerald/10 text-emerald"
                  : "border-border text-muted hover:border-emerald/30 hover:text-foreground"
              )}
            >
              {id === "all" ? t("pages.ideasFilterAll") : t(`pages.communityTopic.${id}`)}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1 rounded-full border border-border p-0.5">
            {(
              [
                { id: "recent" as const, label: t("pages.ideasSortRecent") },
                { id: "popular" as const, label: t("pages.ideasSortPopular") },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSort(item.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  sort === item.id ? "bg-secondary text-foreground" : "text-muted hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {error && !loading ? (
          <div className="mb-6 rounded-xl border border-border bg-secondary/20 p-5 text-sm text-muted">
            {error}
            <button
              type="button"
              onClick={() => void load(true)}
              className="ml-2 font-semibold text-emerald hover:underline"
            >
              {t("pages.communityRetry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <div className="aspect-[16/10] animate-pulse bg-secondary/50" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-secondary/50" />
                  <div className="h-3 w-full animate-pulse rounded bg-secondary/40" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-secondary/40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <FadeIn>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted">{t("pages.communityEmpty")}</p>
            ) : (
              <IdeasPagination page={safePage} totalPages={totalPages} onChange={goToPage} />
            )}
          </FadeIn>
        )}

        <p className="mt-8 text-center text-xs text-muted">{t("pages.ideasDisclaimer")}</p>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-emerald/[0.04] p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-lg font-bold">{t("pages.ideasCtaTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("pages.ideasCtaSub")}</p>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/trading-room">
              {t("nav.tradingRoom")} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}
