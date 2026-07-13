/**
 * Server-side community feed — fetches full publisher RSS (no 10-item client cap).
 * Deployed as a Vercel Function at /api/community-feed
 */

type Topic = "crypto" | "finance" | "markets";

type Article = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  topic: Topic;
  publishedAt: string;
  image?: string;
  author?: string;
};

type Feed = {
  id: string;
  source: string;
  topic: Topic;
  rssUrl: string;
  limit: number;
};

const FEEDS: Feed[] = [
  { id: "ct-main", source: "Cointelegraph", topic: "crypto", rssUrl: "https://cointelegraph.com/rss", limit: 40 },
  { id: "ct-btc", source: "Cointelegraph", topic: "crypto", rssUrl: "https://cointelegraph.com/rss/tag/bitcoin", limit: 30 },
  { id: "ct-markets", source: "Cointelegraph", topic: "crypto", rssUrl: "https://cointelegraph.com/rss/category/market-analysis", limit: 30 },
  { id: "ct-altcoin", source: "Cointelegraph", topic: "crypto", rssUrl: "https://cointelegraph.com/rss/tag/altcoin", limit: 25 },
  { id: "ct-regulation", source: "Cointelegraph", topic: "crypto", rssUrl: "https://cointelegraph.com/rss/tag/regulation", limit: 25 },
  { id: "decrypt", source: "Decrypt", topic: "crypto", rssUrl: "https://decrypt.co/feed", limit: 40 },
  { id: "bbc-biz", source: "BBC Business", topic: "finance", rssUrl: "https://feeds.bbci.co.uk/news/business/rss.xml", limit: 40 },
  { id: "guardian-biz", source: "The Guardian", topic: "finance", rssUrl: "https://www.theguardian.com/business/rss", limit: 40 },
  { id: "guardian-money", source: "The Guardian", topic: "finance", rssUrl: "https://www.theguardian.com/money/rss", limit: 30 },
  { id: "cnbc", source: "CNBC", topic: "markets", rssUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html", limit: 40 },
  { id: "yahoo", source: "Yahoo Finance", topic: "markets", rssUrl: "https://finance.yahoo.com/news/rssindex", limit: 40 },
  { id: "reuters-biz", source: "Reuters", topic: "markets", rssUrl: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best", limit: 30 },
];

function stripHtml(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
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

function tag(block: string, name: string) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function attr(block: string, el: string, attribute: string) {
  const re = new RegExp(`<${el}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*/?>`, "i");
  return block.match(re)?.[1]?.trim() || "";
}

function pickImage(block: string) {
  const candidates = [
    attr(block, "media:content", "url"),
    attr(block, "media:thumbnail", "url"),
    attr(block, "enclosure", "url"),
    block.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1],
  ].filter(Boolean) as string[];

  return candidates.find((u) => /^https?:\/\//i.test(u) && !/\.(mp4|mp3|pdf)(\?|$)/i.test(u));
}

function parseFeed(xml: string, feed: Feed): Article[] {
  const chunks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  const out: Article[] = [];

  for (let i = 0; i < chunks.length && out.length < feed.limit; i++) {
    const block = chunks[i];
    const title = stripHtml(tag(block, "title"));
    const link = tag(block, "link") || attr(block, "link", "href");
    if (!title || !link) continue;

    const image = pickImage(block);
    if (!image) continue;

    const description = tag(block, "description") || tag(block, "content:encoded");
    const pub = tag(block, "pubDate") || tag(block, "dc:date");
    const author =
      stripHtml(tag(block, "dc:creator") || tag(block, "author")).replace(/^Cointelegraph by\s+/i, "") ||
      undefined;
    const guid = tag(block, "guid") || link;

    out.push({
      id: `${feed.id}-${guid}`,
      title,
      summary: stripHtml(description).slice(0, 220),
      url: link.trim(),
      source: feed.source,
      topic: feed.topic,
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      image,
      author,
    });
  }

  return out;
}

async function fetchFeed(feed: Feed): Promise<Article[]> {
  try {
    const res = await fetch(feed.rssUrl, {
      headers: {
        "User-Agent": "VelionMarketsBot/1.0 (+https://velionmarkets.org)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    const xml = await Promise.race([
      res.text(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("timeout")), 12000)),
    ]);
    return parseFeed(xml, feed);
  } catch {
    return [];
  }
}

export async function GET() {
  const settled = await Promise.all(FEEDS.map((f) => fetchFeed(f)));
  const merged = settled.flat();

  const seen = new Set<string>();
  const articles = merged
    .filter((a) => {
      const key = a.url.split("?")[0];
      if (seen.has(key) || !a.image) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));

  return Response.json(
    {
      articles,
      count: articles.length,
      fetchedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
