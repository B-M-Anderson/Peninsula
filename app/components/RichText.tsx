import type { ReactNode } from "react";

/**
 * Renders the small amount of markdown the project descriptions actually use:
 * **bold**, *italic*, `code`, bare URLs, and a leading `~` that marks a line as
 * a footnote-style aside. Deliberately not a markdown library — descriptions
 * are hand-written prose, and this keeps the dependency list and the bundle
 * alone.
 *
 * Everything is built as React elements from split strings, so there is no
 * HTML injection path here.
 */
// Bold is listed first so ** wins over * on the same run of text.
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|https?:\/\/[^\s)]+)/g;

/** A pasted URL, shown as host + path (no tracking query) and made clickable. */
function UrlLink({ href }: { href: string }) {
  const label = urlLabel(href);
  return (
    <a href={href} className="md-link" target="_blank" rel="noopener noreferrer" style={{ display: "inline", fontSize: "inherit" }}>
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function urlLabel(href: string): string {
  try {
    const u = new URL(href);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return href;
  }
}

function inline(text: string, keyPrefix: string, links: boolean): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} style={{ fontWeight: 650, color: "var(--text-body)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} style={{ fontFamily: "var(--font-mono)", fontSize: "0.9em", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "1px 5px", whiteSpace: "nowrap" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^https?:\/\//.test(part)) {
      // Inside a card that is itself a link, a nested <a> is invalid HTML.
      return links ? <UrlLink key={key} href={part} /> : urlLabel(part);
    }
    return part;
  });
}

export default function RichText({
  text,
  /** Drop `~` aside lines — for clamped previews that should stay prose. */
  stripAsides,
  /** Turn bare URLs into links (off when the text already sits inside a link). */
  links = true,
}: {
  text: string;
  stripAsides?: boolean;
  links?: boolean;
}): ReactNode {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  lines.forEach((line, i) => {
    const aside = line.trimStart().startsWith("~");
    if (aside && stripAsides) return;
    if (i > 0 && out.length > 0) out.push("\n");
    if (aside) {
      out.push(
        <span key={`a${i}`} style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
          {inline(line.trimStart().slice(1).trimStart(), `a${i}`, links)}
        </span>
      );
    } else {
      out.push(...inline(line, `l${i}`, links));
    }
  });
  return <>{out}</>;
}
