import { useId } from "react";

type Props = {
  size?: number;
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
 * Never use the two-band variants below 24px — switch to variant="favicon".
 */
export default function Mark({
  size = 64,
  tone = "dark",
  variant = "mark",
  name = "Bennett M. Anderson",
  className,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const fav = variant === "favicon";

  const ground = tone === "light" ? "#FAF4E9" : "#2A190D";
  const letter = tone === "light" ? "#2A190D" : "#F5EBDA";
  const ring = tone === "light" ? "#A98A5C" : "#D3B68A";
  const bands = fav
    ? [{ y: 40, h: 26, fill: tone === "light" ? "#BE9E70" : "#D3B68A" }]
    : [
        { y: 37, h: 18, fill: tone === "light" ? "#BE9E70" : "#D3B68A" },
        { y: 58.5, h: 8.5, fill: tone === "light" ? "#A98A5C" : "#BE9E70" },
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
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="BA monogram" className="block shrink-0">
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
      <circle cx={60} cy={60} r={52} fill={ground} />
      <g clipPath={`url(#${uid}-c)`}>
        {bands.map((b, i) => (
          <rect key={i} x={0} y={b.y} width={120} height={b.h} fill={b.fill} />
        ))}
      </g>
      {text(letter)}
      <g clipPath={`url(#${uid}-b)`}>{text("#2A190D")}</g>
      <circle cx={60} cy={60} r={52} fill="none" stroke={ring} strokeWidth={fav ? 5 : 3.5} />
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
