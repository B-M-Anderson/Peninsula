import { Youtube, FileText, MessageSquare, ArrowUpRight } from "lucide-react";
import { Badge, Card } from "./ui";
import { platformLabel, type Platform, type Post } from "../data/posts";

const platformIcon: Record<Platform, React.ReactNode> = {
  youtube: <Youtube size={11} />,
  substack: <FileText size={11} />,
  x: <MessageSquare size={11} />,
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function PostCard({ p }: { p: Post }) {
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="block md-reveal" style={{ textDecoration: "none", color: "inherit" }}>
      <Card interactive>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <Badge icon={platformIcon[p.platform]}>{platformLabel[p.platform]}</Badge>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", color: "var(--text-faint)" }}>
            {formatDate(p.date)}
          </span>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", margin: 0, color: "var(--text-strong)", display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
          {p.title}
          <ArrowUpRight size={14} aria-hidden style={{ flex: "0 0 auto", color: "var(--text-faint)" }} />
        </h3>
        <span className="sr-only"> (opens in a new tab)</span>
        {p.blurb ? (
          <p style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-sm)", lineHeight: "var(--leading-body)", color: "var(--text-muted)", maxWidth: "var(--measure)" }}>
            {p.blurb}
          </p>
        ) : null}
      </Card>
    </a>
  );
}

/**
 * The newest posts across every channel. The list is assembled on the server
 * (app/lib/posts.ts) when the homepage is built and refreshed every 15
 * minutes, so it is in the HTML on first paint — nothing pops in later.
 */
export default function RecentPosts({ posts, limit = 4 }: { posts: Post[]; limit?: number }) {
  const recent = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);

  if (recent.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
        Nothing published yet — the channels below are where it will land.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {recent.map((p) => (
        <PostCard key={`${p.date}-${p.url}`} p={p} />
      ))}
    </div>
  );
}
