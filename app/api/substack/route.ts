import { NextResponse } from "next/server";
import { SUBSTACK_URL } from "../../data/site";

export const revalidate = 3600; // re-fetch the feed at most hourly

type Post = { title: string; link: string; pubDate: string; snippet: string };

function textBetween(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

export async function GET() {
  if (!SUBSTACK_URL) {
    return NextResponse.json({ configured: false, posts: [] as Post[] });
  }
  try {
    const res = await fetch(`${SUBSTACK_URL.replace(/\/$/, "")}/feed`, {
      headers: { "User-Agent": "bennett-anderson.com feed reader" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, posts: [] as Post[], error: `feed returned ${res.status}` });
    }
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    const posts: Post[] = items.slice(0, 4).map((item) => ({
      title: textBetween(item, "title"),
      link: textBetween(item, "link"),
      pubDate: textBetween(item, "pubDate"),
      snippet: textBetween(item, "description").slice(0, 220),
    }));
    return NextResponse.json({ configured: true, posts });
  } catch {
    return NextResponse.json({ configured: true, posts: [] as Post[], error: "fetch failed" });
  }
}
