"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { VAULT_CODE, VAULT_TRIGGERS } from "../data/site";
import { storageSet } from "../lib/storage";

// Hidden-entry mechanic: typing one of the trigger words anywhere on the site
// (outside a text field) opens a terminal access-gate overlay. Correct code ->
// sessionStorage flag -> /vault. Client-side easter egg by design; not real
// security.

const BOOT_LINES = [
  "BIOSYS v2.6 — restricted partition",
  "mounting /vault ... ok",
  "identity check required",
];

const BUFFER = Math.max(...VAULT_TRIGGERS.map((t) => t.length));

export default function VaultGate({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [input, setInput] = useState("");
  const [denied, setDenied] = useState(0);
  const buffer = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const summonVault = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setBootStep(0);
    setInput("");
    setDenied(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus?.();
  }, []);

  // Global keystroke buffer for the trigger words; Escape closes the gate at
  // any stage, including during the boot lines.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === "Escape") close();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-BUFFER);
      if (VAULT_TRIGGERS.some((t) => buffer.current.endsWith(t))) {
        buffer.current = "";
        summonVault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, summonVault, close]);

  // Lock page scroll while the gate is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Staged boot lines, then focus the code input. While the lines are still
  // typing, the dialog itself holds focus so Tab starts inside it.
  useEffect(() => {
    if (!open) return;
    if (bootStep === 0) dialogRef.current?.focus();
    if (bootStep < BOOT_LINES.length) {
      const t = setTimeout(() => setBootStep((s) => s + 1), 350);
      return () => clearTimeout(t);
    }
    inputRef.current?.focus();
  }, [open, bootStep]);

  const submit = () => {
    if (input.trim().toLowerCase() === VAULT_CODE) {
      storageSet("session", "vault-access", "granted");
      setOpen(false);
      router.push("/vault");
    } else {
      setDenied((d) => d + 1);
      setInput("");
    }
  };

  return (
    <>
      {/* The page behind the gate is inert while it is up — the dialog is the
          only thing focus can reach, which is what aria-modal promises. */}
      <div inert={open}>{children}</div>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Vault access"
            tabIndex={-1}
            className="w-full max-w-md rounded-lg p-6 font-term shadow-2xl"
            style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-default)", color: "var(--text-body)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <p key={i} className="text-sm" style={{ color: "var(--text-muted)" }}>{line}</p>
            ))}
            {bootStep >= BOOT_LINES.length && (
              <div className="mt-3">
                <p role="alert" className="mb-2 text-sm" style={{ color: "var(--status-wip-text)", display: denied > 0 ? "block" : "none" }}>
                  access denied ({denied})
                </p>
                <label className="flex items-center gap-2 text-sm">
                  <span style={{ color: "var(--text-accent)" }}>ACCESS CODE:</span>
                  <input
                    ref={inputRef}
                    type="password"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submit();
                    }}
                    className="bg-transparent border-b outline-none flex-1"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-strong)" }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                <p className="mt-4 text-xs" style={{ color: "var(--text-faint)" }}>[enter] submit · [esc] disconnect</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
