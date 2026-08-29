// Recent posts across every platform — YouTube, Substack, X.
//
// Hand-maintained on purpose. X has no free feed, YouTube's RSS needs a channel
// ID, and the Substack RSS route (`/api/substack`) only covers one of the three;
// one list here keeps all platforms in the same order, with the same shape, and
// gives you a place to say what a post actually is. Newest first.
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
