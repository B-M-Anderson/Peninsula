"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Status = {
  online: boolean;
  provisioned: boolean;
  model: string | null;
  runtime: string;
  host: string;
  note?: string;
  latencyMs?: number | null;
};

type ChatLine = { from: "you" | "node" | "sys"; text: string };

export default function AskPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([
    { from: "sys", text: "channel open. ask about bennett — projects, background, the cat." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/concierge/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);
    setLines((l) => [...l, { from: "you", text: q }]);
    try {
      const res = await fetch("/api/concierge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (data.answer) {
        setLines((l) => [...l, { from: "node", text: data.answer }]);
      } else {
        setLines((l) => [
          ...l,
          {
            from: "sys",
            text: "node offline — the desktop that runs me is powered down or not yet wired up. try ~/projects or ~/contact in the meantime.",
          },
        ]);
      }
    } catch {
      setLines((l) => [...l, { from: "sys", text: "transmission failed. try again." }]);
    }
    setBusy(false);
  };

  const fromColor = (from: ChatLine["from"]) =>
    from === "you"
      ? "text-bio-cyan dark:text-cyto"
      : from === "node"
      ? "text-bio-green dark:text-phos"
      : "text-bio-dim dark:text-phos-dim";

  return (
    <div className="max-w-3xl mx-auto pt-24 pb-16 px-6 font-term">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-bio-green dark:text-phos glow glitch">
          &gt; ask --local
        </h1>
        <p className="text-sm opacity-70 mt-3 leading-relaxed max-w-xl">
          this is (going to be) a small language model running on my own desktop
          at home — no cloud inference, no third-party AI service. questions get
          relayed to my machine, answered there, and sent back. it only knows
          what i&apos;ve published about myself.
        </p>

        {/* status readout */}
        <div className="mt-8 text-sm">
          <p className="opacity-50 mb-2">&gt; node --status</p>
          {!status && <p className="opacity-50">polling<span className="cursor-blink">▮</span></p>}
          {status && (
            <div className="space-y-1 pl-4">
              <p>
                <span className="opacity-50">link:</span>{" "}
                {status.online ? (
                  <span className="text-bio-green dark:text-phos glow">
                    ● ONLINE
                  </span>
                ) : (
                  <span className="text-red-500 dark:text-red-400">○ OFFLINE</span>
                )}
              </p>
              <p><span className="opacity-50">model:</span> {status.model ?? "—"}</p>
              <p><span className="opacity-50">runtime:</span> {status.runtime}</p>
              <p><span className="opacity-50">host:</span> {status.host}</p>
              {status.latencyMs != null && (
                <p><span className="opacity-50">latency:</span> {status.latencyMs}ms</p>
              )}
              {status.note && <p className="opacity-50">{"// "}{status.note}</p>}
            </div>
          )}
        </div>

        {/* chat log */}
        <div className="mt-10">
          <p className="opacity-50 text-sm mb-2">&gt; session.log</p>
          <div
            ref={logRef}
            className="term-panel rounded p-4 h-72 overflow-y-auto text-sm space-y-3"
          >
            {lines.map((line, i) => (
              <div key={i}>
                <span className={`${fromColor(line.from)} opacity-70`}>
                  {line.from === "you" ? "you@web" : line.from === "node" ? "node@desktop" : "sys"}
                  {" ▸ "}
                </span>
                <span className="whitespace-pre-line opacity-90">{line.text}</span>
              </div>
            ))}
            {busy && <p className="opacity-40">…</p>}
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span className="text-bio-green dark:text-phos">&gt;</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="type a question…"
              className="flex-1 bg-transparent outline-none placeholder:opacity-30"
              maxLength={500}
              spellCheck={false}
            />
            <button onClick={send} className="opacity-60 hover:opacity-100 transition">
              [send]
            </button>
          </div>
        </div>

        {/* planned stack */}
        <div className="mt-12 text-sm opacity-70 leading-relaxed">
          <p className="opacity-70">&gt; cat planned-stack.txt</p>
          <div className="pl-4 mt-2 space-y-1">
            <p>runtime: Ollama on the desktop GPU — simplest local-model server there is</p>
            <p>model: a small instruct model (3–8B, quantized) — fast enough for chat</p>
            <p>relay: outbound-only job queue — the desktop polls out; nothing on the home network is exposed</p>
            <p>grounding: one structured markdown doc about me, stuffed into the system prompt</p>
            <p>fallback: if the desktop is asleep, you get honest OFFLINE + links, never a fake answer</p>
          </div>
        </div>

        <p className="text-xs opacity-40 mt-10">
          {"// the node keeps a few cached records even while offline. some of them are about the cat."}
        </p>
      </motion.div>
    </div>
  );
}
