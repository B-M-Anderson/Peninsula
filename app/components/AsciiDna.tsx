"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// Messy glitchy ASCII double helix that fills its container. Two sine strands
// with drifting amplitude, desyncing phase, horizontal tears, row dropouts and
// static bursts — deliberately dense and uneven. Pure text; inherits theme colors.
// mode="vertical" runs the wave down the box; "horizontal" runs it across.

const STRAND_A = ["#", "@", "0", "*", "%", "&"];
const STRAND_B = ["o", "+", "=", ":", "*", "."];
const RUNG = ["─", "·", "-", "="];
const GLITCH_CHARS = ["░", "▒", "▓", "█", "/", "\\", "|", "_", "·", "~", "^"];

// monospace metrics at text-[10px] leading-[11px]
const CHAR_W = 6;
const LINE_H = 11;

function subscribeReducedMotion(cb: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
}

// deterministic hash noise so a given (a,b) is stable within a frame
function rnd(a: number, b: number) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type AsciiDnaProps = {
  mode?: "vertical" | "horizontal";
  className?: string;
  clicksToSummon?: number;
  onSummon?: () => void;
};

export default function AsciiDna({
  mode = "vertical",
  className = "",
  clicksToSummon = 3,
  onSummon,
}: AsciiDnaProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const dims = useRef({ rows: 40, cols: 24 });
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paused = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const el = preRef.current;
    if (!wrap || !el) return;

    const measure = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      dims.current.cols = Math.max(8, Math.floor(w / CHAR_W));
      dims.current.rows = Math.max(6, Math.floor(h / LINE_H));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const render = (t: number) => {
      const { rows, cols } = dims.current;
      const grid: string[][] = Array.from({ length: rows }, () => new Array(cols).fill(" "));
      const step = Math.floor(t * 3);

      // main axis = where the wave travels; cross axis = where strands swing
      const L = mode === "horizontal" ? cols : rows;
      const C = mode === "horizontal" ? rows : cols;
      const center = (C - 1) / 2;
      const baseAmp = center * 0.86;

      // layered, non-repeating global modulation
      const ampMod = 0.68 + 0.24 * Math.sin(t * 0.7) + 0.14 * Math.sin(t * 1.93 + 1.1);
      const phaseDrift = Math.sin(t * 0.45) * 0.9 + Math.sin(t * 0.17) * 0.4; // strands desync from π
      const waveK = (Math.PI * 2) / (14 + 4 * Math.sin(t * 0.29)); // twist rate breathes
      const rungPulse = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.8));

      const put = (main: number, cross: number, ch: string) => {
        const c = Math.round(cross);
        if (c < 0 || c >= C) return;
        if (mode === "horizontal") grid[c][main] = ch;
        else grid[main][c] = ch;
      };

      for (let i = 0; i < L; i++) {
        // horizontal "tear": bands of the main axis jump sideways
        const band = Math.floor(i / 5);
        const tear = rnd(band, step) < 0.12 ? (rnd(band + 3, step) > 0.5 ? 2 : -2) : 0;

        // full dropout: an occasional dead / static row
        const drop = rnd(i, step + 7);
        if (drop < 0.035) {
          if (drop < 0.017) {
            const n = 1 + Math.floor(rnd(i, step) * 4);
            for (let k = 0; k < n; k++) {
              const cc = Math.floor(rnd(i + k, step) * C);
              put(i, cc, GLITCH_CHARS[Math.floor(rnd(k, i + step) * GLITCH_CHARS.length)]);
            }
          }
          continue; // strands skip this row entirely
        }

        const phase = i * waveK + t;
        const ampNoise = 0.8 + 0.35 * rnd(i, step + 2);
        const amp = baseAmp * ampMod * ampNoise;
        const j1 = rnd(i, step) < 0.25 ? (rnd(i + 7, step) > 0.5 ? 1 : -1) : 0;
        const j2 = rnd(i + 13, step) < 0.25 ? (rnd(i + 3, step) > 0.5 ? 1 : -1) : 0;

        const p1 = center + Math.sin(phase) * amp + tear + j1;
        const p2 = center + Math.sin(phase + Math.PI + phaseDrift) * amp + tear + j2;

        const lo = Math.min(p1, p2);
        const hi = Math.max(p1, p2);
        if (hi - lo > 2) {
          for (let x = Math.ceil(lo) + 1; x < hi; x++) {
            if (rnd(x, i + step) < rungPulse) {
              put(i, x, RUNG[Math.floor(rnd(x, i) * RUNG.length)]);
            }
          }
        }
        put(i, p1, STRAND_A[Math.floor(rnd(i, step) * STRAND_A.length)]);
        put(i, p2, STRAND_B[Math.floor(rnd(i + 5, step) * STRAND_B.length)]);
      }

      // scattered static bursts across the whole field
      const bursts = Math.floor(rows * cols * 0.006);
      for (let n = 0; n < bursts; n++) {
        const ry = Math.floor(rnd(n, step) * rows);
        const rx = Math.floor(rnd(n + 31, step) * cols);
        grid[ry][rx] = GLITCH_CHARS[Math.floor(rnd(n, ry + step) * GLITCH_CHARS.length)];
      }

      el.textContent = grid.map((r) => r.join("")).join("\n");
    };

    let raf = 0;
    let last = 0;
    let t = 0;
    render(0);
    if (paused) {
      return () => ro.disconnect();
    }
    const loop = (now: number) => {
      if (now - last > 85) {
        t += 0.13;
        last = now;
        render(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [mode, paused]);

  const handleClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 1200);
    if (clickCount.current >= clicksToSummon) {
      clickCount.current = 0;
      onSummon?.();
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`select-none overflow-hidden w-full h-full ${className}`}
      onClick={handleClick}
      aria-hidden="true"
      title="dna://penrose-strand"
    >
      <pre
        ref={preRef}
        className="font-term text-[10px] leading-[11px] text-bio-green dark:text-phos chroma whitespace-pre m-0"
      />
    </div>
  );
}
