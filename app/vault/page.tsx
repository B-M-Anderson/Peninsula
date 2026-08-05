"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { VAULT_CODE } from "../data/site";

// true only after hydration; false during SSR — avoids reading sessionStorage on the server
const emptySubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(emptySubscribe, () => true, () => false);

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

export default function VaultPage() {
  const hydrated = useHydrated();
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [denied, setDenied] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const granted =
    unlocked || (hydrated && sessionStorage.getItem("vault-access") === "granted");

  useEffect(() => {
    if (hydrated && !granted) inputRef.current?.focus();
  }, [hydrated, granted]);

  const submit = () => {
    if (input.trim().toLowerCase() === VAULT_CODE) {
      sessionStorage.setItem("vault-access", "granted");
      setUnlocked(true);
    } else {
      setDenied((d) => d + 1);
      setInput("");
    }
  };

  if (!hydrated) return null;

  if (!granted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 pt-24">
        <div className="w-full max-w-md rounded-lg p-6 font-term text-sm" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <p className="opacity-70">/vault — restricted partition</p>
          {denied > 0 && <p className="mt-2" style={{ color: "var(--status-wip)" }}>access denied ({denied})</p>}
          <label className="flex items-center gap-2 mt-4">
            <span style={{ color: "var(--text-accent)" }}>ACCESS CODE:</span>
            <input
              ref={inputRef}
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="bg-transparent border-b outline-none flex-1"
              style={{ borderColor: "var(--border-default)" }}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <p className="opacity-40 mt-4 text-xs">
            hint: the cat guards this. ask the machine about her, or read the strands.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-28 pb-16 px-6 font-term">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <p className="text-xs opacity-50">/vault mounted · access granted · session-scoped</p>
        <h1 className="text-3xl font-bold mt-2" style={{ color: "var(--text-accent)" }}>
          THE VAULT
        </h1>

        <div className="rounded-lg p-6 mt-8" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-sm opacity-60 mb-4">&gt; cat currently.log</h2>
          <ul className="space-y-2 text-sm">
            <li><span style={{ color: "var(--text-accent)" }}>building:</span> {CURRENTLY.building}</li>
            <li><span style={{ color: "var(--text-accent)" }}>reading:</span> {CURRENTLY.reading}</li>
            <li><span style={{ color: "var(--text-accent)" }}>listening:</span> {CURRENTLY.listening}</li>
            <li><span style={{ color: "var(--text-accent)" }}>obsessed with:</span> {CURRENTLY.obsessedWith}</li>
          </ul>
        </div>

        <div className="rounded-lg p-6 mt-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-sm opacity-60 mb-4">&gt; specimen --info penrose</h2>
          <table className="text-sm w-full">
            <tbody>
              {PENNY_STATS.map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-6 py-1 whitespace-nowrap align-top" style={{ color: "var(--text-accent)" }}>{k}</td>
                  <td className="py-1 opacity-85">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg p-6 mt-6" style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)" }}>
          <h2 className="text-sm opacity-60 mb-4">&gt; cat lab-note.txt</h2>
          <p className="text-sm opacity-85 leading-relaxed">{CURRENTLY.labNote}</p>
        </div>

        <p className="text-xs opacity-40 mt-8">
          contents rotate whenever something more interesting comes along
        </p>
      </motion.div>
    </div>
  );
}
