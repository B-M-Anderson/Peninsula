"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { VAULT_CODE } from "../data/site";
import { storageGet, storageSet } from "../lib/storage";

// true only after hydration; false during SSR — the unlocked view depends on
// sessionStorage, the gate does not, so the gate is what the HTML carries.
const emptySubscribe = () => () => {};
const useHydrated = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

// ── EDIT ME ─────────────────────────────────────────────────────────────
// This block is the vault's content — "whatever's interesting right now."
// Swap entries freely; the page renders whatever is here.
const CURRENTLY = {
  building: "Local-LLM site concierge — outbound-only relay design",
  reading: "…", // fill in
  listening: "…", // fill in
  obsessedWith: "…", // fill in
  labNote:
    "This partition exists for whatever doesn't fit the public site yet. If you found your way in: nice work — say hi and tell me how you got in.",
};

const PENNY_STATS = [
  ["designation", "Penrose ('Penny')"],
  ["class", "Felis catus / dilute calico"],
  ["role", "chief morale officer"],
  ["threat level", "cardboard boxes: extreme"],
  ["current status", "presumed asleep on something important"],
];
// ────────────────────────────────────────────────────────────────────────

const card = { background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)" };
const prompt = { margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", color: "var(--text-muted)" };

export default function VaultClient() {
  const hydrated = useHydrated();
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [denied, setDenied] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const granted = unlocked || (hydrated && storageGet("session", "vault-access") === "granted");

  useEffect(() => {
    if (hydrated && !granted) inputRef.current?.focus();
  }, [hydrated, granted]);

  const submit = () => {
    if (input.trim().toLowerCase() === VAULT_CODE) {
      storageSet("session", "vault-access", "granted");
      setUnlocked(true);
    } else {
      setDenied((d) => d + 1);
      setInput("");
    }
  };

  if (!granted) {
    return (
      <form
        className="font-term text-sm"
        style={{ ...card, maxWidth: 440 }}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p style={{ margin: 0, color: "var(--text-muted)" }}>/vault — restricted partition</p>
        <p role="alert" className="mt-2" style={{ margin: "var(--space-2) 0 0", color: "var(--status-wip-text)", display: denied > 0 ? "block" : "none" }}>
          access denied ({denied})
        </p>
        <label className="flex items-center gap-2 mt-4">
          <span style={{ color: "var(--text-accent)" }}>ACCESS CODE:</span>
          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent border-b outline-none flex-1"
            style={{ borderColor: "var(--border-default)", color: "var(--text-strong)" }}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <p className="mt-4 text-xs" style={{ color: "var(--text-faint)" }}>
          hint: the cat guards this. ask the machine about her.
        </p>
      </form>
    );
  }

  return (
    <div className="font-term" style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <p className="text-xs" style={{ margin: 0, color: "var(--text-faint)" }}>/vault mounted · access granted · session-scoped</p>

      <section style={card} aria-labelledby="vault-currently">
        <h2 id="vault-currently" style={prompt}>&gt; cat currently.log</h2>
        <ul className="space-y-2 text-sm" style={{ margin: 0, padding: 0, listStyle: "none" }}>
          <li><span style={{ color: "var(--text-accent)" }}>building:</span> {CURRENTLY.building}</li>
          <li><span style={{ color: "var(--text-accent)" }}>reading:</span> {CURRENTLY.reading}</li>
          <li><span style={{ color: "var(--text-accent)" }}>listening:</span> {CURRENTLY.listening}</li>
          <li><span style={{ color: "var(--text-accent)" }}>obsessed with:</span> {CURRENTLY.obsessedWith}</li>
        </ul>
      </section>

      <section style={card} aria-labelledby="vault-penrose">
        <h2 id="vault-penrose" style={prompt}>&gt; specimen --info penrose</h2>
        <table className="text-sm w-full">
          <tbody>
            {PENNY_STATS.map(([k, v]) => (
              <tr key={k}>
                <th scope="row" className="pr-6 py-1 whitespace-nowrap align-top text-left font-normal" style={{ color: "var(--text-accent)" }}>{k}</th>
                <td className="py-1" style={{ color: "var(--text-body)" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={card} aria-labelledby="vault-note">
        <h2 id="vault-note" style={prompt}>&gt; cat lab-note.txt</h2>
        <p className="text-sm leading-relaxed" style={{ margin: 0, color: "var(--text-body)" }}>{CURRENTLY.labNote}</p>
      </section>

      <p className="text-xs" style={{ margin: 0, color: "var(--text-faint)" }}>
        contents rotate whenever something more interesting comes along
      </p>
    </div>
  );
}
