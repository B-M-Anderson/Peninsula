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

  return (
    <div
      aria-hidden={title || subtitle ? undefined : true}
      className={`absolute left-0 right-0 flex flex-col pointer-events-none ${className ?? ""}`}
      style={{ top: offset, gap }}
    >
      <div className={bar} style={{ ...pad, height: thick, background: "var(--stripe-color-a)" }}>
        {title ? (
          <span
            className="leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: sm ? "var(--text-xl)" : "44px",
              letterSpacing: "-0.015em",
            }}
          >
            {title}
          </span>
        ) : null}
      </div>
      <div className={bar} style={{ ...pad, height: thin, background: "var(--stripe-color-b)" }}>
        {subtitle ? (
          <span
            className="leading-none font-medium"
            style={{ fontFamily: "var(--font-body)", fontSize: sm ? "var(--text-xs)" : "18px" }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
