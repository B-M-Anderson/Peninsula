// Recent posts across every platform — YouTube, Substack, X.
//
// The YouTube and Substack feeds are merged in live (app/lib/posts.ts, rendered
// into the homepage on the server); X has no free feed, so its entries only
// ever come from here. Entries in this file win over the feeds and are the
// place to say what a post actually is. Newest first.
//
// To add a post: paste the URL, set the platform, write a one-line blurb, done.

export type Platform = "youtube" | "substack" | "x";

export type Post = {
  platform: Platform;
  title: string;
  url: string;
  /** ISO date, YYYY-MM-DD — used for sorting and display. */
  date: string;
  /** One line. What it is, not a teaser. Optional. */
  blurb?: string;
};

export const platformLabel: Record<Platform, string> = {
  youtube: "video",
  substack: "essay",
  x: "post",
};

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
