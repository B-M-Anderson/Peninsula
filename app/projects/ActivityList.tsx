import Image from "next/image";
import { ArrowUpRight, FileText, GitCommitHorizontal, MessageSquare, Play, Youtube } from "lucide-react";
import { Badge, Card, Dotted, SectionHeading, TextLink } from "../components/ui";
import { PER_SOURCE, timelineOf, type ActivitySource } from "../lib/activity";
import type { Channel, DocItem } from "./ActivityDoc";

const icon: Record<ActivitySource, React.ReactNode> = {
  youtube: <Youtube size={11} />,
  substack: <FileText size={11} />,
  x: <MessageSquare size={11} />,
  github: <GitCommitHorizontal size={11} />,
};

/**
 * Recent activity for the classic projects page (and so for phones, which get
 * the classic look by default): the same data as activity.mlx in the MATLAB
 * view — the newest item from each channel as cards, then a timeline — in the
 * site's own card style, below the projects. Server-rendered; no client code.
 */
export default function ActivityList({ items, channels }: { items: DocItem[]; channels: Channel[] }) {
  const seen = new Set<ActivitySource>();
  const latest = items.filter((i) => (seen.has(i.source) ? false : (seen.add(i.source), true)));
  const timeline = timelineOf(items);

  return (
    <section aria-labelledby="activity-heading" className="md-act">
      <SectionHeading kicker={<Dotted items={channels.map((c) => c.name)} />} id="activity-heading">
        Recent activity
      </SectionHeading>

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
                  <Badge icon={icon[i.source]}>{i.kind}</Badge>
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
                <span aria-hidden className="mw-act-dot" data-s={i.source} />
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
                <a className="md-link md-act-project" href={`#${i.project.id}`}>
                  See the project
                </a>
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
