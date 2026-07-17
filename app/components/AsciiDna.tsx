"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

// ASCII double helix that fills its container. Two clean mirrored sine strands
// with ladder rungs and crossover markers read clearly as DNA; glitch arrives
// in periodic bursts (sideways tears + corruption storms) rather than constant
// noise. Pure text; inherits theme colors.
// mode="vertical" runs the wave down the box; "horizontal" runs it across.

const GLITCH_CHARS = ["░", "▒", "▓", "█", "/", "\\", "|", "_", "~", "^", "*"];

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
      const amp = center * (0.82 + 0.06 * Math.sin(t * 0.5)); // gentle breathe, stays legible
      const wavelength = 11 + 1.5 * Math.sin(t * 0.25);
      const k = (Math.PI * 2) / wavelength;

      // glitch burst: gated windows where the helix tears and corrupts
      const burstId = Math.floor(t * 1.4);
      const glitching = rnd(burstId, 7) < 0.26;
      const tearBand = Math.floor(rnd(burstId, 3) * Math.max(1, L / 6));
      const tearAmt = rnd(burstId, 9) > 0.5 ? 3 : -3;

      const put = (main: number, cross: number, ch: string) => {
        const c = Math.round(cross);
        if (c < 0 || c >= C) return;
        if (mode === "horizontal") grid[c][main] = ch;
        else grid[main][c] = ch;
      };

      for (let i = 0; i < L; i++) {
        const p = i * k + t;
        const inTear = glitching && Math.floor(i / 6) === tearBand;
        const shift = inTear ? tearAmt : 0;

        const x1 = center + Math.sin(p) * amp + shift;
        const x2 = center + Math.sin(p + Math.PI) * amp + shift; // clean mirror → obvious double helix
        const lo = Math.min(x1, x2);
        const hi = Math.max(x1, x2);

        // ladder rungs every 3 rows — the base-pair look
        if (i % 3 === 0 && hi - lo > 1.2) {
          for (let x = Math.round(lo) + 1; x < Math.round(hi); x++) {
            put(i, x, rnd(x, i) < 0.85 ? "-" : "=");
          }
        }

        if (hi - lo <= 1.4) {
          // strands cross — draw the X pinch
          put(i, (x1 + x2) / 2, "X");
        } else {
          // backbones — mostly stable chars so the strands read continuous
          put(i, x1, rnd(i, step) < 0.12 ? "@" : "#");
          put(i, x2, rnd(i + 5, step) < 0.12 ? "0" : "o");
        }

        // faint constant shimmer when calm; heavier handled by burst below
        if (!glitching && rnd(i, step + 2) < 0.02) {
          put(i, Math.floor(rnd(i, step) * C), GLITCH_CHARS[Math.floor(rnd(i, step) * GLITCH_CHARS.length)]);
        }
      }

      // burst corruption storm across the whole field
      if (glitching) {
        const n = Math.floor(rows * cols * 0.03);
        for (let m = 0; m < n; m++) {
          const ry = Math.floor(rnd(m, burstId) * rows);
          const rx = Math.floor(rnd(m + 13, burstId) * cols);
          grid[ry][rx] = GLITCH_CHARS[Math.floor(rnd(m, ry + step) * GLITCH_CHARS.length)];
        }
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
