import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { Badge, Card, TextLink } from "../components/ui";
import SourceLogo from "../components/SourceLogo";
import { PER_SOURCE, timelineOf, type ActivityItem, type ActivitySource } from "../lib/activity";

/** An activity item, plus the project page it belongs to when exactly one project points at its repo. */
export type DocItem = ActivityItem & { project?: { id: string } };
export type Channel = { key: ActivitySource; name: string; url: string };

export const sourceName: Record<ActivitySource, string> = {
  youtube: "YouTube",
  substack: "Substack",
  x: "X",
  github: "GitHub",
};

/**
 * Recent activity across every channel: the newest item from each as cards,
 * then a timeline. Server-rendered; no client code.
 */
export default function ActivityList({ items, channels, id }: { items: DocItem[]; channels: Channel[]; id?: string }) {
  const seen = new Set<ActivitySource>();
  const latest = items.filter((i) => (seen.has(i.source) ? false : (seen.add(i.source), true)));
  const timeline = timelineOf(items);

  return (
    <section id={id} aria-labelledby="activity-heading" className="md-act">
      <h2 id="activity-heading" className="sr-only">Recent activity</h2>
      <h3 className="md-label md-act-sub" style={{ marginTop: 0 }}>Latest from each</h3>

      <ul className="md-act-latest">
        {latest.map((i) => (
          <li key={i.url}>
            <a href={i.url} target="_blank" rel="noopener noreferrer" className="md-card-link">
              <Card interactive className="md-act-card">
                {i.thumb ? (
                  <div className="md-act-thumb" data-portrait={i.portrait ? "true" : undefined}>
                    {i.portrait ? <Image src={i.thumb} alt="" fill sizes="160px" className="md-act-blur" style={{ objectFit: "cover" }} /> : null}
                    <div className="md-act-thumb-img">
                      <Image src={i.thumb} alt="" fill sizes={i.portrait ? "160px" : "(max-width: 640px) 100vw, 360px"} style={{ objectFit: "cover" }} />
                    </div>
                    {i.source === "youtube" ? (
                      <span aria-hidden className="md-act-play">
                        <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="md-act-meta">
                  <Badge icon={<SourceLogo source={i.source} size={11} />}>{i.kind}</Badge>
                  <span className="md-act-when">{i.when}</span>
                </div>
                <h3 className="md-act-title">
                  {i.title}
                  <ArrowUpRight size={14} aria-hidden style={{ flex: "0 0 auto", color: "var(--text-faint)" }} />
                </h3>
                <span className="sr-only"> (opens in a new tab)</span>
                {i.detail ? <p className="md-act-detail">{i.detail}</p> : null}
              </Card>
            </a>
          </li>
        ))}
      </ul>

      <h3 className="md-label md-act-sub">Timeline · newest {PER_SOURCE} from each</h3>
      <ol className="md-act-list">
        {timeline.map((i) => (
          <li key={`${i.at}-${i.url}`}>
            <span className="md-act-when">{i.when}</span>
            <span className="md-act-row">
              <a className="md-act-link" href={i.url} target="_blank" rel="noopener noreferrer">
                {i.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <span className="md-act-line">
                <SourceLogo source={i.source} className="md-act-logo" />
                {i.kind}
                {i.detail ? (
                  <>
                    {" · "}
                    {i.sha ? <code>{i.sha}</code> : null}
                    {i.detail}
                  </>
                ) : null}
              </span>
              {i.project ? (
                <Link className="md-link md-act-project" href={`/projects/${i.project.id}`}>
                  See the project
                </Link>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <div className="md-act-channels">
        {channels.map((c) => (
          <TextLink key={c.key} href={c.url} arrow>
            {c.name}
          </TextLink>
        ))}
      </div>
    </section>
  );
}
