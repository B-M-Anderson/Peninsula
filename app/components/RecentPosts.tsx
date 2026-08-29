import Link from "next/link";
import { Youtube, FileText, MessageSquare, ArrowUpRight } from "lucide-react";
import { Badge, Card } from "./ui";
import { posts, platformLabel, type Platform, type Post } from "../data/posts";

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
    <Link href={p.url} target="_blank" rel="noopener noreferrer" className="block" style={{ textDecoration: "none", color: "inherit" }}>
      <Card interactive>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <Badge icon={platformIcon[p.platform]}>{platformLabel[p.platform]}</Badge>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", letterSpacing: "var(--tracking-label)", color: "var(--text-faint)" }}>
            {formatDate(p.date)}
          </span>
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", margin: 0, color: "var(--text-strong)", display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
          {p.title}
          <ArrowUpRight size={14} style={{ flex: "0 0 auto", color: "var(--text-faint)" }} />
        </h3>
        {p.blurb ? (
          <p style={{ margin: "var(--space-3) 0 0", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)", maxWidth: "var(--measure)" }}>
            {p.blurb}
          </p>
        ) : null}
      </Card>
    </Link>
  );
}

export default function RecentPosts({ limit = 4 }: { limit?: number }) {
  const recent = [...posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);

  if (recent.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>
        {"// nothing published yet"}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {recent.map((p, i) => (
        <PostCard key={`${p.date}-${p.url}-${i}`} p={p} />
      ))}
    </div>
  );
}
