import type { ReactNode } from "react";
import Image from "next/image";
import { Chip } from "../components/ui";
import RichText from "../components/RichText";
import DeferredMedia from "../components/DeferredMedia";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { youTubeId } from "../lib/youtube";
import type { Project } from "../data/projects";

function Figure({ n, label, maxWidth, children }: { n: number; label: string; maxWidth: number; children: ReactNode }) {
  return (
    <figure className="mw-figure" style={{ maxWidth }}>
      <figcaption className="mw-figbar">
        <span aria-hidden className="mw-figmark" />
        Figure {n}: {label}
      </figcaption>
      <div className="mw-figbody">{children}</div>
    </figure>
  );
}

/**
 * One project as a live-script page: title, then %% sections, the demo first
 * so a visitor sees the thing before the text about it. Rendered on the
 * server for every project (the text stays in the HTML for deep links and
 * crawlers); only the selected project's media mounts (DeferredMedia).
 */
export default function ProjectDoc({ p }: { p: Project }) {
  const skills = [...p.skills].sort(
    (a, b) => (p.importantSkills?.includes(b) ? 1 : 0) - (p.importantSkills?.includes(a) ? 1 : 0)
  );
  const videoId = p.videoUrl ? youTubeId(p.videoUrl) : null;
  const aspect = p.imageAspect ?? 1;
  const hasOutput = Boolean(p.imageUrl || videoId);
  let figure = 0;
  return (
    <article className="mw-doc">
      <h2 className="mw-doc-title">{p.title}</h2>
      {hasOutput && (
        <section className="mw-sec" aria-label="Output">
          <div className="mw-sec-head" aria-hidden>
            %% Output
          </div>
          <div className="mw-outputs">
            {videoId && (
              <Figure n={++figure} label="demo video" maxWidth={640}>
                <DeferredMedia aspect={16 / 9} style={{ width: "100%" }}>
                  <YouTubeEmbed id={videoId} title={`${p.title} — video`} flush />
                </DeferredMedia>
              </Figure>
            )}
            {p.imageUrl && (
              <Figure n={++figure} label="preview" maxWidth={420}>
                <DeferredMedia aspect={aspect} style={{ width: "100%" }}>
                  <Image src={p.imageUrl} alt={`${p.title} preview`} width={420} height={Math.round(420 / aspect)} sizes="(max-width: 640px) 100vw, 420px" style={{ width: "100%", height: "auto", display: "block" }} />
                </DeferredMedia>
              </Figure>
            )}
          </div>
        </section>
      )}
      <section className="mw-sec" aria-label="Overview">
        <div className="mw-sec-head" aria-hidden>
          %% Overview
        </div>
        <p className="md-prose mw-prose">
          <RichText text={p.description} />
        </p>
      </section>
      <section className="mw-sec" aria-label="Skills">
        <div className="mw-sec-head" aria-hidden>
          %% Skills
        </div>
        <ul aria-label="Skills used" className="mw-skills">
          {skills.map((s) => (
            <li key={s}>
              <Chip emphasis={p.importantSkills?.includes(s) ? "strong" : "normal"}>{s}</Chip>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
