import { posts as manualPosts, type Post } from "../data/posts";
import { SITE_URL, YOUTUBE_CHANNEL_ID, SUBSTACK_URL, YOUTUBE_URL } from "../data/site";

// Live "Recent posts": the hand-maintained list merged with the YouTube and
// Substack feeds. Server-only — the homepage renders the result at build time
// and again every REVALIDATE_SECONDS, so there is no client fetch and no
// empty-then-populated flash. X has no free feed, so its entries only ever
// come from app/data/posts.ts.

export const REVALIDATE_SECONDS = 900;

function tag(block: string, name: string): string | null {
  const m = block.match(
    new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`)
  );
  return m ? m[1].trim() : null;
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function isoDate(raw: string | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": `bennettanderson.com/1.0 (+${SITE_URL})` },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function youTubePosts(): Promise<Post[]> {
  if (!YOUTUBE_URL || !YOUTUBE_CHANNEL_ID) return [];
  const xml = await fetchFeed(`https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`);
  if (!xml) return [];
  return (xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []).flatMap((entry) => {
    const title = tag(entry, "title");
    const date = isoDate(tag(entry, "published"));
    const link = entry.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/)?.[1];
    if (!title || !date || !link) return [];
    return [{ platform: "youtube" as const, title: decode(title), url: decode(link), date }];
  });
}

async function substackPosts(): Promise<Post[]> {
  if (!SUBSTACK_URL) return [];
  const xml = await fetchFeed(`${SUBSTACK_URL.replace(/\/$/, "")}/feed`);
  if (!xml) return [];
  return (xml.match(/<item>[\s\S]*?<\/item>/g) ?? []).flatMap((item) => {
    const title = tag(item, "title");
    const date = isoDate(tag(item, "pubDate"));
    const link = tag(item, "link");
    if (!title || !date || !link) return [];
    return [{ platform: "substack" as const, title: decode(title), url: decode(link), date }];
  });
}

/** Every post we know about, newest first, de-duplicated by URL. */
export async function getPosts(): Promise<Post[]> {
  const [yt, sub] = await Promise.all([youTubePosts(), substackPosts()]);

  const seen = new Set<string>();
  const merged: Post[] = [];
  // Hand-written entries win: they carry blurbs the feeds don't have.
  for (const p of [...manualPosts, ...yt, ...sub]) {
    // Only the fragment is noise. Stripping the query too would collapse every
    // youtube.com/watch?v=... to one key and throw away all but the first.
    const key = p.url.replace(/#.*$/, "").replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(p);
  }
  merged.sort((a, b) => b.date.localeCompare(a.date));
  return merged;
}
