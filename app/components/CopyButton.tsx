"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui";

/** Copies a string to the clipboard; the path that works when mailto: doesn't. */
export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt("Copy this address", text);
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={copy} iconLeft={copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}>
        {copied ? "Copied" : label}
      </Button>
      <span className="sr-only" aria-live="polite">{copied ? `${text} copied to the clipboard` : ""}</span>
    </>
  );
}
