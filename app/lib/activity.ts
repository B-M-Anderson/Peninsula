import { getPosts, REVALIDATE_SECONDS } from "./posts";
import { postLabel, thumbnailOf, formatOf } from "../data/posts";
import { GITHUB_USER, SITE_URL } from "../data/site";

// "Recent activity" for the projects browser: the Recent posts feed (YouTube,
// Substack, the hand-written X entries) plus the GitHub repos pushed to most
// recently, each with its latest commit. Server-only, cached like the posts
// feeds (REVALIDATE_SECONDS). Every source fails soft: a feed that is down or
// rate-limited just contributes nothing.
//
// GitHub allows 60 unauthenticated API calls an hour per IP, and Vercel's IPs
// are shared, so set GITHUB_TOKEN (a fine-grained token with no extra scopes —
// public data only) in Vercel to lift that to 5,000. Without one it still works
// until the shared limit is hit, then shows the repos without commit messages
// or drops GitHub for that cache window.

export type ActivitySource = "youtube" | "substack" | "x" | "github";

export type ActivityItem = {
  source: ActivitySource;
  /** What the tag says: "YouTube short", "Substack article", "GitHub commit". */
  kind: string;
  /** Post title, or the repo name for GitHub. */
  title: string;
  /** Post blurb, or the commit's first line (the repo description when there is no commit). */
  detail?: string;
  url: string;
  /** ISO date (posts) or date-time (GitHub). */
  at: string;
  /** "today", "yesterday", "3 days ago", "Aug 2026" — worked out on the server. */
  when: string;
  thumb: string | null;
  /** A YouTube Short: its thumbnail is portrait. */
  portrait?: boolean;
  /** GitHub only: the repo's page (for matching it to a project) and the commit's short hash. */
  repoUrl?: string;
  sha?: string;
};

/** The timeline keeps the newest few from each channel, so a burst of Shorts can't bury a commit. */
export const PER_SOURCE = 6;
const REPO_LIMIT = 5;
const DAY = 86_400_000;

/** Milliseconds for a post's date (read as UTC midnight) or a GitHub time; NaN when unreadable. */
export const timeOf = (at: string) => new Date(at.length === 10 ? `${at}T00:00:00Z` : at).getTime();

/** Day-precision age, in UTC: posts only carry a date, so GitHub times are read the same way. */
export function agoLabel(at: string, now: number): string {
  const t = timeOf(at);
  if (Number.isNaN(t)) return "";
  const days = Math.floor(now / DAY) - Math.floor(t / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return new Date(t).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export const ageDays = (at: string, now: number) => (now - timeOf(at)) / DAY;

async function gh<T>(path: string): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": `bennettanderson.com/1.0 (+${SITE_URL})`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

type Repo = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
};
type Commit = { sha: string; html_url: string; commit: { message: string; committer: { date: string } | null } };

const firstLine = (s: string) => s.split("\n")[0].trim();

async function githubActivity(now: number): Promise<ActivityItem[]> {
  const repos = await gh<Repo[]>(`/users/${GITHUB_USER}/repos?type=owner&sort=pushed&per_page=15`);
  if (!Array.isArray(repos)) return [];
  const recent = repos
    // The profile README repo is named after the user and is not a project.
    .filter((r) => !r.fork && !r.archived && !r.private && r.name.toLowerCase() !== GITHUB_USER.toLowerCase())
    .slice(0, REPO_LIMIT);
  return Promise.all(
    recent.map(async (r): Promise<ActivityItem> => {
      const commits = await gh<Commit[]>(`/repos/${r.full_name}/commits?per_page=1`);
      const c = Array.isArray(commits) ? commits[0] : undefined;
      const at = c?.commit.committer?.date ?? r.pushed_at;
      // The social card GitHub draws for every repo; the path segment before the
      // owner is only a cache key, so the commit hash refreshes it per commit.
      const thumb = `https://opengraph.githubassets.com/${c?.sha.slice(0, 12) ?? "1"}/${r.full_name}`;
      return {
        source: "github",
        kind: c ? "GitHub commit" : "GitHub repo",
        title: r.name,
        detail: c ? firstLine(c.commit.message) : (r.description ?? undefined),
        url: c?.html_url ?? r.html_url,
        at,
        when: agoLabel(at, now),
        thumb,
        repoUrl: r.html_url,
        sha: c?.sha.slice(0, 7),
      };
    })
  );
}

/** The timeline's rows: newest first, at most PER_SOURCE from any one channel. */
export function timelineOf<T extends { source: ActivitySource }>(items: T[]): T[] {
  const n = new Map<ActivitySource, number>();
  return items.filter((i) => {
    const k = (n.get(i.source) ?? 0) + 1;
    n.set(i.source, k);
    return k <= PER_SOURCE;
  });
}

/** Everything, newest first. */
export async function getActivity(): Promise<{ items: ActivityItem[]; now: number }> {
  const now = Date.now();
  const [posts, github] = await Promise.all([getPosts(), githubActivity(now)]);
  const fromPosts = posts.map(
    (p): ActivityItem => ({
      source: p.platform,
      kind: postLabel(p),
      title: p.title,
      detail: p.blurb,
      url: p.url,
      at: p.date,
      when: agoLabel(p.date, now),
      thumb: thumbnailOf(p),
      portrait: formatOf(p) === "short",
    })
  );
  const items = [...fromPosts, ...github].sort((a, b) => (timeOf(b.at) || 0) - (timeOf(a.at) || 0));
  return { items, now };
}
