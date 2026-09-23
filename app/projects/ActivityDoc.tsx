import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { PER_SOURCE, timelineOf, type ActivityItem, type ActivitySource } from "../lib/activity";

export type DocItem = ActivityItem & { project?: { id: string; file: string } };
export type Channel = { key: ActivitySource; name: string; url: string };

export const sourceName: Record<ActivitySource, string> = {
  youtube: "YouTube",
  substack: "Substack",
  x: "X",
  github: "GitHub",
};

/** The item's cover, decorative (the card's text names it). A Short is portrait: its 9:16 sits in the middle over a blurred copy of itself. */
function Thumb({ item }: { item: DocItem }) {
  if (!item.thumb) return null;
  const playable = item.source === "youtube";
  // The same `sizes` for both copies of a Short, so the browser fetches one file.
  const sizes = item.portrait ? "160px" : "(max-width: 719px) 100vw, 300px";
  return (
    <div className="mw-act-thumb" data-portrait={item.portrait ? "true" : undefined}>
      {item.portrait ? <Image src={item.thumb} alt="" fill sizes={sizes} className="mw-act-blur" style={{ objectFit: "cover" }} /> : null}
      <div className="mw-act-thumb-img">
        <Image src={item.thumb} alt="" fill sizes={sizes} style={{ objectFit: "cover" }} />
      </div>
      {playable ? (
        <span aria-hidden className="mw-act-play">
          <Play size={12} fill="currentColor" style={{ marginLeft: 1 }} />
        </span>
      ) : null}
    </div>
  );
}

/**
 * Recent activity as a live-script page: the newest thing from each channel as
 * figures, then everything as a table, newest first. Built on the server from
 * getActivity() (app/lib/activity.ts); the "when" labels are the server's, so
 * nothing here depends on the visitor's clock.
 */
export default function ActivityDoc({ items, channels }: { items: DocItem[]; channels: Channel[] }) {
  const seen = new Set<ActivitySource>();
  const latest = items.filter((i) => (seen.has(i.source) ? false : (seen.add(i.source), true)));
  const timeline = timelineOf(items);
  const from = latest.map((i) => sourceName[i.source]);
  const fromText = from.length > 1 ? `${from.slice(0, -1).join(", ")} and ${from[from.length - 1]}` : from[0];

  return (
    <article className="mw-doc">
      <h2 className="mw-doc-title">Recent activity</h2>
      <p className="mw-comment">% Pulled in from {fromText} every 15 minutes; the timeline keeps the newest {PER_SOURCE} from each.</p>

      <section className="mw-sec" aria-label="Latest from each channel">
        <div className="mw-sec-head" aria-hidden>
          %% Latest
        </div>
        <ul className="mw-act-grid">
          {latest.map((i, n) => (
            <li key={i.url} style={{ "--i": n } as CSSProperties}>
              <a className="mw-act-card" href={i.url} target="_blank" rel="noopener noreferrer">
                <span className="mw-figbar">
                  <span aria-hidden className="mw-act-dot" data-s={i.source} />
                  Figure {n + 1}: {i.kind}
                </span>
                <Thumb item={i} />
                <span className="mw-act-body">
                  <span className="mw-act-title">{i.title}</span>
                  {i.detail ? <span className="mw-act-detail">{i.detail}</span> : null}
                  <span className="mw-act-when">
                    {i.when}
                    <ArrowUpRight size={12} aria-hidden />
                  </span>
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mw-sec" aria-label="Timeline">
        <div className="mw-sec-head" aria-hidden>
          %% Timeline
        </div>
        <table className="mw-act-table">
          <caption>
            activity = {timeline.length}×3 table
          </caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Source</th>
              <th scope="col">Item</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((i) => (
              <tr key={`${i.at}-${i.url}`}>
                <td className="mw-act-td-when">{i.when}</td>
                <td className="mw-act-td-src">
                  <span aria-hidden className="mw-act-dot" data-s={i.source} />
                  {i.kind}
                </td>
                <td>
                  <span className="mw-act-kind">
                    <span aria-hidden className="mw-act-dot" data-s={i.source} />
                    {i.kind}
                  </span>
                  <a className="mw-act-link" href={i.url} target="_blank" rel="noopener noreferrer">
                    {i.title}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  {i.detail ? <span className="mw-act-detail">{i.sha ? <code>{i.sha}</code> : null}{i.detail}</span> : null}
                  {i.project ? (
                    <a className="mw-act-open" href={`#${i.project.id}`}>
                      open {i.project.file}
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {channels.length ? (
        <section className="mw-sec" aria-label="Channels">
          <div className="mw-sec-head" aria-hidden>
            %% Channels
          </div>
          <ul className="mw-act-channels">
            {channels.map((c) => (
              <li key={c.key}>
                <a className="md-link" href={c.url} target="_blank" rel="noopener noreferrer">
                  <span aria-hidden className="mw-act-dot" data-s={c.key} />
                  {c.name}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
