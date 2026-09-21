import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import CopyButton from "../components/CopyButton";
import { Button, TextLink } from "../components/ui";
import { StyleSwitch } from "../lib/stylePref";
import "./plasmid.css";

export type Feature = {
  key: "email" | "phone" | "linkedin" | "github" | "resume";
  label: string;
  value: string;
  href?: string;
  rel?: string;
  copy?: string;
  newTab?: boolean;
  /** Where the feature sits on the map, in degrees clockwise from the top. */
  span: [number, number];
};

const CX = 320;
const CY = 280;
const R = 170;

const pt = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const f1 = (n: number) => n.toFixed(1);

function arc(a0: number, a1: number) {
  const [x0, y0] = pt(a0, R);
  const [x1, y1] = pt(a1, R);
  return `M${f1(x0)} ${f1(y0)}A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}`;
}

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/** One feature drawn on the ring: its arc, a leader line and its name. */
function MapFeature({ f }: { f: Feature }) {
  const mid = (f.span[0] + f.span[1]) / 2;
  const [ax, ay] = pt(mid, R + 24);
  const [bx, by] = pt(mid, R + 46);
  const anchor = bx > CX + 8 ? "start" : bx < CX - 8 ? "end" : "middle";
  const drawing = (
    <>
      <path d={arc(f.span[0], f.span[1])} pathLength={1} className="pm-arc" data-k={f.key} />
      <line x1={f1(ax)} y1={f1(ay)} x2={f1(bx)} y2={f1(by)} className="pm-leader" />
      <text x={f1(bx + (anchor === "start" ? 6 : anchor === "end" ? -6 : 0))} y={f1(by + (anchor === "middle" ? (by > CY ? 14 : -6) : 0))} textAnchor={anchor} dominantBaseline={anchor === "middle" ? "auto" : "middle"} className="pm-flabel">
        {f.label}
      </text>
    </>
  );
  if (!f.href) return <g className="pm-feat" data-k={f.key}>{drawing}</g>;
  // A mouse target only: the Features list carries the real, focusable link,
  // so the map stays a picture to keyboards and screen readers.
  const blank = /^https?:/.test(f.href) || f.newTab;
  return (
    <a href={f.href} tabIndex={-1} target={blank ? "_blank" : undefined} rel={[blank ? "noopener noreferrer" : "", f.rel ?? ""].filter(Boolean).join(" ") || undefined} className="pm-feat" data-k={f.key}>
      {drawing}
    </a>
  );
}

/**
 * Contact as a plasmid map: each way to reach Bennett is a labelled feature on
 * a circular map, listed with its details in a Features panel. The panel is
 * the content and comes first — in the DOM, and on screen on a phone — so the
 * address is the first thing on the page; the map is a picture of the same
 * list. Hovering or focusing a row lights its arc, and hovering an arc lights
 * its row.
 */
export default function PlasmidContact({ features, lede, note }: { features: Feature[]; lede: ReactNode; note: string }) {
  return (
    <main id="main" tabIndex={-1} className="md-dapple" style={{ position: "relative", paddingTop: 59 }}>
      <h1 className="sr-only">Get in touch</h1>
      <div className="md-above">
        <section className="pm" aria-label="Contact map">
          <div className="pm-bar">
            <span>contact.dna</span>
            <span className="pm-bar-note">{note}</span>
            <StyleSwitch page="contact" to="plain">
              Plain view
            </StyleSwitch>
          </div>

          <div className="pm-body">
            <div className="pm-panel">
              <div className="pm-panel-head">Features</div>
              <ul className="pm-features">
                {features.map((f) => (
                  <li key={f.key} className="pm-row" data-k={f.key}>
                    <span aria-hidden className="pm-swatch" />
                    <span className="pm-fname">{f.label}</span>
                    <span className="pm-fvalue">
                      {f.href ? (
                        <TextLink href={f.href} rel={f.rel} newTab={f.newTab}>
                          {f.value}
                        </TextLink>
                      ) : (
                        <span>{f.value}</span>
                      )}
                      {f.copy ? <CopyButton text={f.copy} /> : null}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="pm-panel-head">Notes</div>
              <div className="pm-notes">
                <p>{lede}</p>
                <Button variant="primary" href={features.find((f) => f.key === "email")?.href} iconRight={<ArrowRight size={15} />}>
                  Start an email
                </Button>
              </div>
            </div>

            <div className="pm-map">
              <svg viewBox="0 0 640 560" role="img" aria-label={`Circular map of the ways to reach me: ${features.map((f) => f.label).join(", ")}`}>
                <circle cx={CX} cy={CY} r={R + 7} className="pm-ring" />
                <circle cx={CX} cy={CY} r={R - 7} className="pm-ring" />
                {TICKS.map((deg) => {
                  const [x0, y0] = pt(deg, R + 12);
                  const [x1, y1] = pt(deg, R + 20);
                  const [tx, ty] = pt(deg, R - 30);
                  return (
                    <g key={deg}>
                      <line x1={f1(x0)} y1={f1(y0)} x2={f1(x1)} y2={f1(y1)} className="pm-tick" />
                      <text x={f1(tx)} y={f1(ty)} textAnchor="middle" dominantBaseline="middle" className="pm-bp">
                        {Math.round((deg / 360) * 3000)}
                      </text>
                    </g>
                  );
                })}
                {features.map((f) => (
                  <MapFeature key={f.key} f={f} />
                ))}
                <text x={CX} y={CY - 10} textAnchor="middle" className="pm-name-svg">
                  Bennett M. Anderson
                </text>
                <text x={CX} y={CY + 16} textAnchor="middle" className="pm-sub-svg">
                  {features.length} features
                </text>
              </svg>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
