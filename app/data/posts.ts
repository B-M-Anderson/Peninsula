// Recent posts across every platform — YouTube, Substack, X.
//
// The YouTube and Substack feeds are merged in live (app/lib/posts.ts, rendered
// into the homepage on the server); X has no free feed, so its entries only
// ever come from here. Entries in this file win over the feeds and are the
// place to say what a post actually is. Newest first.
//
// To add a post: paste the URL, set the platform, write a one-line blurb, done.

import { youTubeId } from "../lib/youtube";

export type Platform = "youtube" | "substack" | "x";

/** What kind of thing a post is on its platform. Left off, it is worked out from the platform and URL. */
export type PostFormat = "video" | "short" | "article" | "podcast" | "post";

export type Post = {
  platform: Platform;
  title: string;
  url: string;
  /** ISO date, YYYY-MM-DD — used for sorting and display. */
  date: string;
  /** One line. What it is, not a teaser. Optional. */
  blurb?: string;
  format?: PostFormat;
  /** Cover image URL. YouTube posts get theirs from the video id; Substack ones come from the feed. */
  thumbnail?: string;
};

const platformName: Record<Platform, string> = {
  youtube: "YouTube",
  substack: "Substack",
  x: "X",
};

export function formatOf(p: Post): PostFormat {
  if (p.format) return p.format;
  if (p.platform === "youtube") return /youtube\.com\/shorts\//.test(p.url) ? "short" : "video";
  return p.platform === "substack" ? "article" : "post";
}

/** What the tag on a post says: "YouTube video", "YouTube short", "Substack article", "X post". */
export function postLabel(p: Post): string {
  return `${platformName[p.platform]} ${formatOf(p)}`;
}

/** The post's cover image, or null when it has none (an X post, a Substack piece with no cover). */
export function thumbnailOf(p: Post): string | null {
  if (p.thumbnail) return p.thumbnail;
  const id = p.platform === "youtube" ? youTubeId(p.url) : null;
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export const posts: Post[] = [
  // Nothing published yet. Until there is, the section renders a quiet
  // placeholder and the channel links below it still work.
  //
  // Add one like this, newest first:
  //   {
  //     platform: "youtube",
  //     title: "Centrifuge repair",
  //     url: "https://www.youtube.com/watch?v=...",
  //     date: "2026-08-29",
  //     blurb: "Tearing down and fixing a benchtop centrifuge.",
  //   },
];
