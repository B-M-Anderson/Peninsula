import Image from "next/image";
import { Youtube, FileText, MessageSquare, ArrowUpRight, Play } from "lucide-react";
import { Badge, Card } from "./ui";
import { formatOf, postLabel, thumbnailOf, type Platform, type Post } from "../data/posts";

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

/**
 * The post's cover in a 16:9 frame. A Short is portrait, so it is cropped to
 * its own 9:16 and centred in the frame (YouTube's thumbnail for one is the
 * vertical video with bars either side; cover-fitting into a 9:16 box trims
 * exactly those bars). Decorative: the card's own text names the post.
 */
function Thumb({ p }: { p: Post }) {
  const src = thumbnailOf(p);
  if (!src) return null;
  const format = formatOf(p);
  const short = format === "short";
  const playable = format === "video" || short;
  return (
    <div
      className="md-post-thumb"
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        width: "100%",
        maxWidth: 320,
        aspectRatio: "16 / 9",
        overflow: "hidden",
        marginBottom: "var(--space-4)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-sunken)",
      }}
    >
      <div style={{ position: "relative", height: "100%", aspectRatio: short ? "9 / 16" : "16 / 9" }}>
        <Image src={src} alt="" fill sizes={short ? "180px" : "(max-width: 640px) 100vw, 320px"} style={{ objectFit: "cover" }} />
      </div>
      {playable ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            display: "grid",
            placeItems: "center",
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(27, 16, 7, 0.72)",
            color: "#FFFDF9",
          }}
        >
          <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
        </span>
      ) : null}
    </div>
  );
}

function PostCard({ p }: { p: Post }) {
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" className="md-card-link md-reveal">
      <Card interactive>
        <Thumb p={p} />
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", marginBottom: "var(--space-3)", flexWrap: "wrap" }}>
          <Badge icon={platformIcon[p.platform]}>{postLabel(p)}</Badge>
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
