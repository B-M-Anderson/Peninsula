type Props = {
  title?: string;
  subtitle?: string;
  /** Distance from the top edge to the top of the thick band. */
  offset?: string;
  size?: "md" | "sm";
  className?: string;
};

/**
 * The signature motif: two full-bleed tan bands of unequal weight toward the
 * top of a surface. The upper band carries the title, the lower one the
 * subheader, both in brown. One set per surface — never centred, never at the
 * bottom, never inset from the edges.
 */
export default function StripeBand({ title, subtitle, offset = "88px", size = "md", className }: Props) {
  const sm = size === "sm";
  const thick = sm ? "36px" : "var(--stripe-thick)";
  const thin = sm ? "16px" : "var(--stripe-thin)";
  const gap = sm ? "8px" : "var(--stripe-gap)";

  const bar = "flex items-center box-border";
  const pad = { paddingInline: "var(--stripe-inset)", color: "var(--stripe-text)" };
  // Fluid type so long titles (e.g. a full name) stay on one line on phones
  // instead of wrapping into the band below. Bands use min-height so any wrap
  // grows the band rather than clipping it.
  const titleSize = sm ? "var(--text-xl)" : "clamp(24px, 6vw, 44px)";
  const subSize = sm ? "var(--text-xs)" : "clamp(13px, 3.4vw, 18px)";

  return (
    <div
      aria-hidden={title || subtitle ? undefined : true}
      className={`absolute left-0 right-0 flex flex-col pointer-events-none ${className ?? ""}`}
      style={{ top: offset, gap }}
    >
      <div className={bar} style={{ ...pad, minHeight: thick, paddingBlock: sm ? "4px" : "6px", background: "var(--stripe-color-a)" }}>
        {title ? (
          <span
            className="leading-none whitespace-nowrap"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: titleSize,
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </span>
        ) : null}
      </div>
      <div className={bar} style={{ ...pad, minHeight: thin, paddingBlock: sm ? "3px" : "5px", background: "var(--stripe-color-b)" }}>
        {subtitle ? (
          <span
            className="font-medium"
            style={{ fontFamily: "var(--font-body)", fontSize: subSize, lineHeight: 1.2 }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
