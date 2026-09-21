"use client";

import { statusColor } from "../components/ui";
import type { BrowserRow } from "./ProjectBrowser";

/**
 * Every project as a point on a plot of completion against date, drawn like a
 * MATLAB figure: gridlines, ticks, and a data cursor with a datatip on the
 * selected project. A picture of what the Current Folder already lists, so it
 * is hidden from assistive tech and its points are mouse targets only (the
 * folder is the keyboard path). Dates are printed from the rows' server-made
 * labels: formatting them here would follow the visitor's timezone and could
 * hydrate with a different month than the server wrote.
 */
export default function PlotFigure({ rows, selectedId, onPick }: { rows: BrowserRow[]; selectedId: string; onPick: (id: string) => void }) {
  const dated = rows.filter((r) => r.dateMs);
  if (dated.length < 2) return null;
  const first = dated.reduce((a, b) => (b.dateMs < a.dateMs ? b : a));
  const last = dated.reduce((a, b) => (b.dateMs > a.dateMs ? b : a));
  const t0 = first.dateMs;
  const span = last.dateMs - t0 || 1;
  const x = (ms: number) => ((ms - t0) / span) * 100;
  const sel = rows.find((r) => r.id === selectedId);

  return (
    <figure className="mw-plot" aria-hidden>
      <figcaption className="mw-figbar">
        <span className="mw-figmark" />
        Figure 1: completion vs. date
      </figcaption>
      <div className="mw-plot-body">
        <span className="mw-plot-y mw-plot-y100">100</span>
        <span className="mw-plot-y mw-plot-y50">50</span>
        <span className="mw-plot-y mw-plot-y0">0</span>
        <div className="mw-plot-area">
          <div className="mw-plot-field">
            {sel ? (
              <>
                <span className="mw-cursor-x" style={{ left: `${x(sel.dateMs)}%` }} />
                <span className="mw-cursor-y" style={{ bottom: `${sel.completion}%` }} />
              </>
            ) : null}
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                tabIndex={-1}
                className="mw-point"
                data-on={r.id === selectedId ? "true" : undefined}
                style={{ left: `${x(r.dateMs)}%`, bottom: `${r.completion}%`, background: statusColor[r.status] }}
                onClick={() => onPick(r.id)}
                title={r.name}
              />
            ))}
            {sel ? (
              <span className="mw-datatip" data-flip={x(sel.dateMs) > 55 ? "left" : "right"} data-drop={sel.completion > 70 ? "down" : "up"} style={{ left: `${x(sel.dateMs)}%`, bottom: `${sel.completion}%` }}>
                <b>{sel.name}</b>
                <span>X: {sel.dateShort}</span>
                <span>Y: {sel.completion}</span>
              </span>
            ) : null}
          </div>
        </div>
        <span className="mw-plot-x mw-plot-x0">{first.dateShort}</span>
        <span className="mw-plot-x mw-plot-x1">{last.dateShort}</span>
      </div>
    </figure>
  );
}
