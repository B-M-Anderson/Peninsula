"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VAULT_CODE, VAULT_TRIGGER } from "../data/site";

// Hidden-entry mechanic: typing the trigger word anywhere on the site (or a
// component calling summonVault(), e.g. triple-clicking the DNA helix) opens a
// terminal access-gate overlay. Correct code -> sessionStorage flag -> /vault.
// Client-side easter egg by design; not real security.

const VaultContext = createContext<{ summonVault: () => void }>({ summonVault: () => {} });
export const useVault = () => useContext(VaultContext);

const BOOT_LINES = [
  "BIOSYS v2.6 — restricted partition",
  "mounting /vault ... ok",
  "identity check required",
];

export default function VaultGate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [input, setInput] = useState("");
  const [denied, setDenied] = useState(0);
  const buffer = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const summonVault = useCallback(() => {
    setBootStep(0);
    setInput("");
    setOpen(true);
  }, []);

  // global keystroke buffer for the trigger word
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-VAULT_TRIGGER.length);
      if (buffer.current === VAULT_TRIGGER) {
        buffer.current = "";
        summonVault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, summonVault]);

  // staged boot lines, then focus the code input
  useEffect(() => {
    if (!open) return;
    if (bootStep < BOOT_LINES.length) {
      const t = setTimeout(() => setBootStep((s) => s + 1), 350);
      return () => clearTimeout(t);
    }
    inputRef.current?.focus();
  }, [open, bootStep]);

  const submit = () => {
    if (input.trim().toLowerCase() === VAULT_CODE) {
      sessionStorage.setItem("vault-access", "granted");
      setOpen(false);
      router.push("/vault");
    } else {
      setDenied((d) => d + 1);
      setInput("");
    }
  };

  return (
    <VaultContext.Provider value={{ summonVault }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg term-frame p-6 font-term text-sm text-phos glow shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <p key={i} className="opacity-80">{line}</p>
            ))}
            {bootStep >= BOOT_LINES.length && (
              <div className="mt-3">
                {denied > 0 && (
                  <p className="text-red-400 mb-2">access denied ({denied})</p>
                )}
                <label className="flex items-center gap-2">
                  <span className="text-phos-bright">ACCESS CODE:</span>
                  <input
                    ref={inputRef}
                    type="password"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                      if (e.key === "Escape") setOpen(false);
                    }}
                    className="bg-transparent border-b border-phos/40 outline-none flex-1 text-phos-bright caret-phos-bright"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="cursor-blink">▮</span>
                </label>
                <p className="opacity-40 mt-4 text-xs">[enter] submit · [esc] disconnect</p>
              </div>
            )}
          </div>
        </div>
      )}
    </VaultContext.Provider>
  );
}
