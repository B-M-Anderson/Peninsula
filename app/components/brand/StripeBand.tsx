import type { ReactNode } from "react";
type Props = {
  title?: string;
  subtitle?: ReactNode;
  /** Distance from the top edge to the top of the thick band. */
  offset?: string;
  size?: "md" | "sm";
  className?: string;
  /** Heading level for the title. Every page's band carries its h1. */
  as?: "h1" | "h2" | "div";
};

/**
 * The signature motif: two full-bleed tan bands of unequal weight toward the
 * top of a surface. The upper band carries the title, the lower one the
 * subheader, both in brown. One set per surface — never centred, never at the
 * bottom, never inset from the edges. The text inside shares the page's
 * content column, so it lines up with what sits below it at every width.
 */
export default function StripeBand({ title, subtitle, offset = "88px", size = "md", className, as = "h1" }: Props) {
  const sm = size === "sm";
  const thick = sm ? "36px" : "var(--stripe-thick)";
  const thin = sm ? "16px" : "var(--stripe-thin)";
  const gap = sm ? "8px" : "var(--stripe-gap)";
  const Title = as;

  const bar = "flex items-center box-border";
  const column = {
    width: "100%",
    maxWidth: "var(--max-width)",
    margin: "0 auto",
    paddingInline: "var(--gutter-page)",
    boxSizing: "border-box" as const,
    color: "var(--stripe-text)",
  };
  // Fluid type so long titles (e.g. a full name) stay on one line on phones
  // instead of wrapping into the band below. Bands use min-height so any wrap
  // grows the band rather than clipping it.
  const titleSize = sm ? "var(--text-xl)" : "clamp(22px, 7.6vw, 44px)";
  const subSize = sm ? "var(--text-xs)" : "clamp(13px, 3.4vw, 18px)";

  return (
    <div
      aria-hidden={title || subtitle ? undefined : true}
      className={`absolute left-0 right-0 flex flex-col pointer-events-none ${className ?? ""}`}
      style={{ top: offset, gap }}
    >
      <div className={`${bar} md-band md-band-a`} style={{ minHeight: thick, paddingBlock: sm ? "4px" : "6px", background: "var(--stripe-color-a)" }}>
        <div style={column}>
          {title ? (
            <Title
              className="leading-none whitespace-nowrap"
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: titleSize,
                letterSpacing: "-0.015em",
              }}
            >
              {title}
            </Title>
          ) : null}
        </div>
      </div>
      <div className={`${bar} md-band md-band-b`} style={{ minHeight: thin, paddingBlock: sm ? "3px" : "5px", background: "var(--stripe-color-b)" }}>
        <div style={column}>
          {subtitle ? (
            <p
              className="font-medium"
              style={{ margin: 0, fontFamily: "var(--font-body)", fontSize: subSize, lineHeight: 1.2 }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
