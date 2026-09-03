import { useId } from "react";

type Props = {
  size?: number;
  /** Force a ground. Omit to follow the page theme through the --mark-* tokens. */
  tone?: "dark" | "light";
  variant?: "mark" | "lockup" | "favicon";
  name?: string;
  className?: string;
};

/**
 * The BA circle, crossed behind the letters by the two-band motif. The
 * monogram reads cream where it clears the bands and brown where it crosses
 * them, so the mark and the motif interlock.
 *
 * Colours come from CSS tokens by default, so the mark follows html.light /
 * html.dark with no JavaScript and never flips after hydration.
 *
 * Never use the two-band variants below 24px — switch to variant="favicon".
 */
export default function Mark({
  size = 64,
  tone,
  variant = "mark",
  name = "Bennett M. Anderson",
  className,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fav = variant === "favicon";

  const fixed = tone
    ? tone === "light"
      ? { ground: "#FAF4E9", letter: "#2A190D", ring: "#A98A5C", bandA: "#BE9E70", bandB: "#A98A5C" }
      : { ground: "#2A190D", letter: "#F5EBDA", ring: "#D3B68A", bandA: "#D3B68A", bandB: "#BE9E70" }
    : { ground: "var(--mark-ground)", letter: "var(--mark-letter)", ring: "var(--mark-ring)", bandA: "var(--mark-band-a)", bandB: "var(--mark-band-b)" };

  const bands = fav
    ? [{ y: 40, h: 26, fill: fixed.bandA }]
    : [
        { y: 37, h: 18, fill: fixed.bandA },
        { y: 58.5, h: 8.5, fill: fixed.bandB },
      ];

  const text = (fill: string) => (
    <text
      x={60}
      y={78}
      textAnchor="middle"
      fill={fill}
      fontFamily="var(--font-display)"
      fontSize={fav ? 58 : 52}
      fontWeight={fav ? 500 : 400}
      letterSpacing="-1.5"
    >
      BA
    </text>
  );

  const glyph = (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden focusable="false" className="block shrink-0">
      <defs>
        <clipPath id={`${uid}-c`}>
          <circle cx={60} cy={60} r={52} />
        </clipPath>
        <clipPath id={`${uid}-b`}>
          {bands.map((b, i) => (
            <rect key={i} x={0} y={b.y} width={120} height={b.h} />
          ))}
        </clipPath>
      </defs>
      <circle cx={60} cy={60} r={52} fill={fixed.ground} />
      <g clipPath={`url(#${uid}-c)`}>
        {bands.map((b, i) => (
          <rect key={i} x={0} y={b.y} width={120} height={b.h} fill={b.fill} />
        ))}
      </g>
      {text(fixed.letter)}
      <g clipPath={`url(#${uid}-b)`}>{text("var(--stripe-text)")}</g>
      <circle cx={60} cy={60} r={52} fill="none" stroke={fixed.ring} strokeWidth={fav ? 5 : 3.5} />
    </svg>
  );

  if (variant !== "lockup") {
    return <span className={className}>{glyph}</span>;
  }

  return (
    <span className={`inline-flex items-center ${className ?? ""}`} style={{ gap: Math.round(size * 0.28) }}>
      {glyph}
      <span
        className="whitespace-nowrap leading-tight"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: Math.round(size * 0.42),
          letterSpacing: "-0.015em",
          color: tone === "light" ? "#2A190D" : "var(--text-strong)",
        }}
      >
        {name}
      </span>
    </span>
  );
}
