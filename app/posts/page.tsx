import type { Metadata } from "next";
import PageFrame from "../components/PageFrame";
import RecentPosts from "../components/RecentPosts";
import ActivityList, { sourceName, type Channel, type DocItem } from "./ActivityList";
import { Dotted, TextLink } from "../components/ui";
import { projectSlug, publishedProjects, type Project } from "../data/projects";
import { getActivity, type ActivitySource } from "../lib/activity";
import { getPosts } from "../lib/posts";
import { openGraphFor } from "../lib/og";
import { GITHUB_URL, SUBSTACK_URL, X_URL, YOUTUBE_URL } from "../data/site";

const description = "Videos, essays, posts and recent commits, newest first, pulled in from YouTube, Substack, X and GitHub.";

// Rebuilt every 15 minutes, like the homepage, so new uploads appear on their own.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Posts",
  description,
  alternates: { canonical: "/posts" },
  openGraph: openGraphFor("/posts", description),
};

const repoKey = (url: string) => url.toLowerCase().replace(/\/+$/, "");

/** A repo links back to its project only when exactly one project points at it. */
function projectsByRepo(): Map<string, { id: string }> {
  const seen = new Map<string, Project[]>();
  for (const p of publishedProjects) {
    if (!p.githubUrl) continue;
    const k = repoKey(p.githubUrl);
    seen.set(k, [...(seen.get(k) ?? []), p]);
  }
  const out = new Map<string, { id: string }>();
  for (const [k, ps] of seen) if (ps.length === 1) out.set(k, { id: projectSlug(ps[0]) });
  return out;
}

const channels: Channel[] = (
  [
    ["youtube", YOUTUBE_URL],
    ["substack", SUBSTACK_URL],
    ["x", X_URL],
    ["github", GITHUB_URL],
  ] as [ActivitySource, string | null][]
).flatMap(([key, url]) => (url ? [{ key, name: sourceName[key], url }] : []));

/* Everything published or pushed lately, on a page of its own: the newest item
   from each channel, then a timeline. When no feed can be read it falls back to
   the hand-kept list of posts. */
export default async function PostsPage() {
  const { items } = await getActivity();
  const repos = projectsByRepo();
  const docItems: DocItem[] = items.map((i) => {
    const project = i.repoUrl ? repos.get(repoKey(i.repoUrl)) : undefined;
    return project ? { ...i, project } : i;
  });

  return (
    <PageFrame title="Posts" subtitle={<Dotted items={["Video", "essays", "posts", "commits"]} />}>
      {docItems.length ? (
        <ActivityList items={docItems} channels={channels} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", maxWidth: 720 }}>
          <RecentPosts posts={await getPosts()} limit={12} />
          <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
            {channels.map((c) => (
              <TextLink key={c.key} href={c.url} arrow>
                {c.name}
              </TextLink>
            ))}
          </div>
        </div>
      )}
    </PageFrame>
  );
}
