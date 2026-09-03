// ---- Accordion -------------------------------------------------------------

export type AccordionItem = {
  /** Stable id: element id for deep links, and the key React tracks the row by. */
  id: string;
  title: ReactNode;
  meta?: ReactNode;
  content: ReactNode;
};

// Location hash as an external store, so a `/projects#slug` link (or a
// back/forward move between hashes) can open the matching row without a
// setState-in-effect. The server snapshot is empty; the client re-reads on
// hydration, which is the documented useSyncExternalStore behaviour.
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const noHash = () => "";

export function Accordion({
  items,
  defaultOpen,
  syncHash,
}: {
  items: AccordionItem[];
  /** id of the row open on first paint; defaults to none. */
  defaultOpen?: string;
  /** Read #hash on load / hashchange, and write it back as rows open. */
  syncHash?: boolean;
}) {
  const hash = useSyncExternalStore(subscribeHash, syncHash ? readHash : noHash, noHash);
  // `undefined` = the visitor hasn't touched anything yet, so the hash (if it
  // names a row) or the default decides. `null` = they closed everything.
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  const hashOpen = hash && items.some((it) => it.id === hash) ? hash : null;
  const open = choice !== undefined ? choice : (hashOpen ?? defaultOpen ?? null);

  // Bring a deep-linked row into view once its panel has laid out. The fixed
  // navbar is accounted for by scroll-margin-top on the row.
  useEffect(() => {
    if (!syncHash || !hashOpen || choice !== undefined) return;
    document.getElementById(hashOpen)?.scrollIntoView({ block: "start" });
  }, [syncHash, hashOpen, choice]);

  const toggle = (id: string) => {
    const next = open === id ? null : id;
    setChoice(next);
    if (syncHash && typeof history !== "undefined") {
      const url = next ? `#${encodeURIComponent(next)}` : window.location.pathname + window.location.search;
      history.replaceState(history.state, "", url);
    }
  };

  return (
    <div>
      {items.map((item) => {
        const isOpen = open === item.id;
        const panelId = `${item.id}-panel`;
        const triggerId = `${item.id}-trigger`;
        return (
          <div key={item.id} id={item.id} className={`md-acc-row${isOpen ? " md-acc-open" : ""}`}>
            <button
              type="button"
              id={triggerId}
              className="md-acc-trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(item.id)}
            >
              <span className="min-w-0" style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
                {item.title}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
                {item.meta ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{item.meta}</span>
                ) : null}
                <span className="md-acc-marker" aria-hidden>+</span>
              </span>
            </button>
            <div className="md-acc-panel">
              {/* inert keeps links, buttons and embeds inside a collapsed panel
                  out of the tab order and away from screen readers. */}
              <div id={panelId} role="region" aria-labelledby={triggerId} className="md-acc-inner" inert={!isOpen}>
                <div style={{ padding: "0 0 var(--space-7)" }}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
