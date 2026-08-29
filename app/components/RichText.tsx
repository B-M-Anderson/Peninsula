import type { ReactNode } from "react";

/**
 * Renders the small amount of markdown the project descriptions actually use:
 * **bold**, *italic* and `code`. Deliberately not a markdown library — descriptions are
 * hand-written prose, and this keeps the dependency list and the bundle alone.
 *
 * Everything is built as React elements from split strings, so there is no HTML
 * injection path here.
 */
// Bold is listed first so ** wins over * on the same run of text.
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;

export default function RichText({ text }: { text: string }): ReactNode {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} style={{ fontWeight: 650, color: "var(--text-body)" }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "0.9em", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "1px 5px", whiteSpace: "nowrap" }}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}
