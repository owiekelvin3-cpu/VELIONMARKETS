/** Live community news from legitimate publisher RSS + CoinGecko trending. */

export type CommunityTopic = "all" | "crypto" | "finance" | "markets";

export type IdeaBias = "long" | "short" | "neutral" | "education";

export type CommunityArticle = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: Exclude<CommunityTopic, "all">;
  publishedAt: string;
  image?: string;
  author?: string;
};

/** TradingView-style idea card model derived from live articles. */
export type CommunityIdea = CommunityArticle & {
  symbol: string;
  bias: IdeaBias;
  handle: string;
  updated: boolean;
};

export type TrendingCoin = {
  id: string;
  symbol: string;
  name: string;
  rank: number;
  priceUsd?: number;
  change24h?: number;
};

type RssItem = {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  author?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  enclosure?: { link?: string; thumbnail?: string };
};

type Rss2JsonResponse = {
  status?: string;
  feed?: { title?: string };
  items?: RssItem[];
};

type FeedConfig = {
  id: string;
  source: string;
  topic: Exclude<CommunityTopic, "all">;
  rssUrl: string;
  limit: number;
};

const RSS2JSON = "https://api.rss2json.com/v1/api.json";
const COINGECKO_TRENDING = "https://api.coingecko.com/api/v3/search/trending";
/** Soft in-memory TTL; daily key forces a fresh pull once per calendar day. */
const CACHE_MS = 60 * 60 * 1000;
const STORAGE_KEY = "velion-community-feed-v1";

const FEEDS: FeedConfig[] = [
  {
    id: "cointelegraph",
    source: "Cointelegraph",
    topic: "crypto",
    rssUrl: "https://cointelegraph.com/rss",
    limit: 10,
  },
  {
    id: "decrypt",
    source: "Decrypt",
    topic: "crypto",
    rssUrl: "https://decrypt.co/feed",
    limit: 10,
  },
  {
    id: "bbc-business",
    source: "BBC Business",
    topic: "finance",
    rssUrl: "https://feeds.bbci.co.uk/news/business/rss.xml",
    limit: 10,
  },
  {
    id: "cnbc",
    source: "CNBC",
    topic: "markets",
    rssUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    limit: 10,
  },
  {
    id: "yahoo-finance",
    source: "Yahoo Finance",
    topic: "markets",
    rssUrl: "https://finance.yahoo.com/news/rssindex",
    limit: 10,
  },
  {
    id: "guardian-business",
    source: "The Guardian",
    topic: "finance",
    rssUrl: "https://www.theguardian.com/business/rss",
    limit: 10,
  },
  {
    id: "cointelegraph-markets",
    source: "Cointelegraph",
    topic: "crypto",
    rssUrl: "https://cointelegraph.com/rss/category/market-analysis",
    limit: 10,
  },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

let articlesCache: { day: string; at: number; items: CommunityArticle[] } | null = null;
let trendsCache: { at: number; items: TrendingCoin[] } | null = null;

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImgFromHtml(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  const src = match?.[1]?.trim();
  if (!src || src.startsWith("data:")) return undefined;
  return src;
}

function isLikelyImageUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(url)) return true;
  // Many CDNs omit extensions (Decrypt, Cointelegraph, BBC)
  if (/\/(media|images|image|img|photos|thumbnail|wp-content|ichef|cdn)\b/i.test(url)) return true;
  return !/\.(mp4|mp3|pdf|xml|json)(\?|$)/i.test(url);
}

function pickImage(item: RssItem) {
  const candidates = [
    item.thumbnail,
    item.enclosure?.thumbnail,
    item.enclosure?.link,
    extractImgFromHtml(item.description || ""),
    extractImgFromHtml(item.content || ""),
  ].filter((u): u is string => Boolean(u));

  return candidates.find(isLikelyImageUrl);
}

function toArticle(feed: FeedConfig, item: RssItem, index: number): CommunityArticle | null {
  const title = item.title?.trim();
  const url = item.link?.trim();
  if (!title || !url) return null;

  const image = pickImage(item);
  // Only keep publisher images — never synthesize placeholders
  if (!image) return null;

  const raw = item.description || item.content || "";
  const summary = stripHtml(raw).slice(0, 220);

  return {
    id: `${feed.id}-${item.guid || url || index}`,
    title,
    summary,
    url,
    source: feed.source,
    topic: feed.topic,
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    image,
    author: item.author?.replace(/^Cointelegraph by\s+/i, "").trim() || undefined,
  };
}

function readStoredArticles(): CommunityArticle[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { day?: string; items?: CommunityArticle[] };
    if (parsed.day === todayKey() && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredArticles(items: CommunityArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: todayKey(), items, at: Date.now() }));
  } catch {
    /* ignore quota */
  }
}

async function fetchFeed(feed: FeedConfig): Promise<CommunityArticle[]> {
  const endpoint = `${RSS2JSON}?rss_url=${encodeURIComponent(feed.rssUrl)}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`RSS ${feed.id} HTTP ${res.status}`);
  const data = (await res.json()) as Rss2JsonResponse;
  if (data.status !== "ok" || !Array.isArray(data.items)) return [];
  return data.items
    .slice(0, feed.limit)
    .map((item, i) => toArticle(feed, item, i))
    .filter((a): a is CommunityArticle => Boolean(a));
}

export async function fetchCommunityArticles(force = false): Promise<CommunityArticle[]> {
  const day = todayKey();

  if (!force && articlesCache?.day === day && Date.now() - articlesCache.at < CACHE_MS) {
    return articlesCache.items;
  }

  if (!force) {
    const stored = readStoredArticles();
    if (stored) {
      articlesCache = { day, at: Date.now(), items: stored };
      return stored;
    }
  }

  const settled = await Promise.allSettled(FEEDS.map((f) => fetchFeed(f)));
  const merged: CommunityArticle[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") merged.push(...result.value);
  }

  const seen = new Set<string>();
  const deduped = merged
    .filter((a) => {
      const key = a.url.split("?")[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(a.image);
    })
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  if (deduped.length === 0) {
    if (articlesCache?.items.length) return articlesCache.items;
    const stored = readStoredArticles();
    if (stored) return stored;
    return [];
  }

  articlesCache = { day, at: Date.now(), items: deduped };
  writeStoredArticles(deduped);
  return deduped;
}

export async function fetchTrendingCoins(force = false): Promise<TrendingCoin[]> {
  if (!force && trendsCache && Date.now() - trendsCache.at < CACHE_MS) {
    return trendsCache.items;
  }

  try {
    const res = await fetch(COINGECKO_TRENDING);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = (await res.json()) as {
      coins?: Array<{
        item?: {
          id?: string;
          symbol?: string;
          name?: string;
          market_cap_rank?: number | null;
          data?: { price?: number; price_change_percentage_24h?: { usd?: number } };
        };
      }>;
    };

    const items = (data.coins ?? [])
      .map((row, i) => {
        const item = row.item;
        if (!item?.id || !item.symbol || !item.name) return null;
        return {
          id: item.id,
          symbol: item.symbol.toUpperCase(),
          name: item.name,
          rank: item.market_cap_rank ?? i + 1,
          priceUsd: item.data?.price,
          change24h: item.data?.price_change_percentage_24h?.usd,
        } satisfies TrendingCoin;
      })
      .filter((c): c is TrendingCoin => Boolean(c))
      .slice(0, 12);

    trendsCache = { at: Date.now(), items };
    return items;
  } catch {
    return trendsCache?.items ?? [];
  }
}

export function formatArticleTime(iso: string, locale?: string) {
  const date = new Date(iso);
  if (Number.isNaN(+date)) return "";
  const diffMs = Date.now() - +date;
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return date.toLocaleDateString(locale || undefined, { month: "short", day: "numeric" });
}

const SYMBOL_RULES: Array<{ re: RegExp; symbol: string }> = [
  { re: /\b(bitcoin|btc)\b/i, symbol: "BTCUSD" },
  { re: /\b(ethereum|eth)\b/i, symbol: "ETHUSD" },
  { re: /\b(solana|sol)\b/i, symbol: "SOLUSD" },
  { re: /\b(xrp|ripple)\b/i, symbol: "XRPUSD" },
  { re: /\b(dogecoin|doge)\b/i, symbol: "DOGEUSD" },
  { re: /\b(gold|xau)\b/i, symbol: "XAUUSD" },
  { re: /\b(silver|xag)\b/i, symbol: "XAGUSD" },
  { re: /\beur\/?usd|euro\b/i, symbol: "EURUSD" },
  { re: /\bgbp\/?usd|sterling|pound\b/i, symbol: "GBPUSD" },
  { re: /\busd\/?jpy|yen\b/i, symbol: "USDJPY" },
  { re: /\bnasdaq|ndx|qqq\b/i, symbol: "NDX" },
  { re: /\bs&p|spx|spy\b/i, symbol: "SPX" },
  { re: /\bdow|djia\b/i, symbol: "DJI" },
  { re: /\boil|crude|wti\b/i, symbol: "USOIL" },
  { re: /\btesla|tsla\b/i, symbol: "TSLA" },
  { re: /\bapple|aapl\b/i, symbol: "AAPL" },
  { re: /\bnvidia|nvda\b/i, symbol: "NVDA" },
  { re: /\bmicrosoft|msft\b/i, symbol: "MSFT" },
  { re: /\bmeta\b/i, symbol: "META" },
  { re: /\bstablecoin|usdt|usdc\b/i, symbol: "USDT" },
];

function inferSymbol(title: string, summary: string, topic: CommunityArticle["topic"]) {
  const text = `${title} ${summary}`;
  for (const rule of SYMBOL_RULES) {
    if (rule.re.test(text)) return rule.symbol;
  }
  if (topic === "crypto") return "CRYPTO";
  if (topic === "markets") return "MARKETS";
  return "FINANCE";
}

function inferBias(title: string, summary: string): IdeaBias {
  const text = `${title} ${summary}`.toLowerCase();
  if (/\b(how to|guide|explainer|what is|tutorial|education|learn)\b/.test(text)) {
    return "education";
  }
  const bull =
    (text.match(/\b(bullish|surge|rally|soar|breakout|recovery|reclaim|buy|long|upside|gains?|jumps?)\b/g) || [])
      .length;
  const bear =
    (text.match(/\b(bearish|crash|plunge|selloff|sell-off|decline|drop|short|downside|falls?|slump|rejection)\b/g) || [])
      .length;
  if (bull > bear && bull > 0) return "long";
  if (bear > bull && bear > 0) return "short";
  return "neutral";
}

function toHandle(author: string | undefined, source: string) {
  const base = (author || source).replace(/^by\s+/i, "").trim();
  return base
    .replace(/[^a-zA-Z0-9_\s.-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 24) || "desk";
}

export function articlesToIdeas(articles: CommunityArticle[]): CommunityIdea[] {
  return articles.map((a) => {
    const ageH = (Date.now() - +new Date(a.publishedAt)) / 3_600_000;
    return {
      ...a,
      symbol: inferSymbol(a.title, a.summary, a.topic),
      bias: inferBias(a.title, a.summary),
      handle: toHandle(a.author, a.source),
      updated: ageH < 12 && ageH > 0.5,
    };
  });
}

export const COMMUNITY_SOURCES = FEEDS.map((f) => ({
  id: f.id,
  name: f.source,
  topic: f.topic,
  homepage:
    f.id.startsWith("cointelegraph")
      ? "https://cointelegraph.com"
      : f.id === "decrypt"
        ? "https://decrypt.co"
        : f.id === "bbc-business"
          ? "https://www.bbc.com/news/business"
          : f.id === "cnbc"
            ? "https://www.cnbc.com"
            : f.id === "guardian-business"
              ? "https://www.theguardian.com/business"
              : "https://finance.yahoo.com",
}));

/** Page size for TradingView-style community grid */
export const COMMUNITY_PAGE_SIZE = 9;

export function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 5) return [1, 2, 3, 4, 5, 6, 7, 8, 9, "ellipsis", total];
  if (current >= total - 4) {
    return [1, "ellipsis", total - 8, total - 7, total - 6, total - 5, total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 2, current - 1, current, current + 1, current + 2, "ellipsis", total];
}
