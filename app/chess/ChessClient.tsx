"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "../components/ui";
import { json, type ChessGame, type ChessMoveResponse, type ChessReply, type ChessStatusResponse } from "../lib/api-types";
import "./chess.css";

// The browser only draws the board and collects clicks. Every move goes to
// /api/chess/move with the whole game so far; the desktop node checks it,
// answers, and sends back the new position and the legal moves from it.

type Color = "white" | "black";
type Phase = "ready" | "thinking" | "error";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const START_LEGAL = [
  "a2a3", "a2a4", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4", "e2e3", "e2e4",
  "f2f3", "f2f4", "g2g3", "g2g4", "h2h3", "h2h4", "b1a3", "b1c3", "g1f3", "g1h3",
];
const START: ChessGame = {
  fen: START_FEN,
  moves: [],
  san: [],
  turn: "white",
  check: false,
  legal: START_LEGAL,
  outcome: { over: false, result: null, reason: null },
};

const FILES = "abcdefgh";
const GLYPH: Record<string, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const NAME: Record<string, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const TEXT = "︎"; // keep ♟ a text glyph, never an emoji

type Piece = { type: string; color: "w" | "b" };

/** 64 squares, index = rank * 8 + file (a1 = 0, h8 = 63). */
function parseFen(fen: string): (Piece | null)[] {
  const board: (Piece | null)[] = Array(64).fill(null);
  const rows = fen.split(" ")[0].split("/");
  rows.forEach((row, i) => {
    const rank = 7 - i;
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
      } else {
        board[rank * 8 + file] = { type: ch.toLowerCase(), color: ch === ch.toLowerCase() ? "b" : "w" };
        file += 1;
      }
    }
  });
  return board;
}

const sqName = (sq: number) => `${FILES[sq % 8]}${Math.floor(sq / 8) + 1}`;
const sqIndex = (name: string) => (Number(name[1]) - 1) * 8 + FILES.indexOf(name[0]);

function outcomeText(game: ChessGame, player: Color): string {
  const o = game.outcome;
  if (!o.over) return "";
  if (o.reason === "checkmate") return o.winner === player ? "Checkmate. You win." : "Checkmate. Jewel wins.";
  const why: Record<string, string> = {
    stalemate: "stalemate",
    insufficient_material: "insufficient material",
    threefold_repetition: "threefold repetition",
    fivefold_repetition: "fivefold repetition",
    fifty_moves: "the fifty-move rule",
    seventyfive_moves: "the seventy-five-move rule",
  };
  return `Draw by ${why[o.reason ?? ""] ?? "rule"}.`;
}

function engineNote(status: ChessStatusResponse | null): string {
  if (!status) return "Checking on the desktop…";
  if (!status.online) {
    return status.note === "not set up yet"
      ? "The board isn't connected to the desktop yet."
      : "The desktop that runs Jewel is off right now, so the board can't take moves.";
  }
  const short = status.build?.commit?.slice(0, 7) ?? "unknown";
  if (!status.build?.playable) {
    return `Jewel's current build (${short}) can't choose moves yet, so a random legal move plays for it. The desktop installs each new version within five minutes of a push, once it passes its tests.`;
  }
  return `Running Jewel build ${short}. The desktop installs each new version within five minutes of a push, once it passes its tests.`;
}

export default function ChessClient() {
  const [game, setGame] = useState<ChessGame>(START);
  const [player, setPlayer] = useState<Color>("white");
  const [phase, setPhase] = useState<Phase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [promo, setPromo] = useState<{ from: string; to: string } | null>(null);
  const [lastReply, setLastReply] = useState<ChessReply | null>(null);
  const [status, setStatus] = useState<ChessStatusResponse | null>(null);
  const [focusSq, setFocusSq] = useState<number>(sqIndex("e2"));
  const gameId = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/chess/status", { cache: "no-store" })
      .then(json<ChessStatusResponse>)
      .then((s) => live && setStatus(s))
      .catch(() => live && setStatus({ online: false, note: "unreachable" }));
    return () => {
      live = false;
    };
  }, []);

  const board = parseFen(game.fen);
  const myColor = player === "white" ? "w" : "b";
  const myTurn = game.turn === player && !game.outcome.over && phase !== "thinking";
  const from = (sq: number) => game.legal.filter((m) => m.startsWith(sqName(sq)));
  const targets = new Set(selected === null ? [] : from(selected).map((m) => sqIndex(m.slice(2, 4))));
  const last = game.moves.at(-1);
  const lastSquares = new Set(last ? [sqIndex(last.slice(0, 2)), sqIndex(last.slice(2, 4))] : []);
  const kingInCheck = game.check ? board.findIndex((p) => p?.type === "k" && p.color === (game.turn === "white" ? "w" : "b")) : -1;

  async function send(moves: string[]) {
    const id = gameId.current;
    setPhase("thinking");
    setError(null);
    try {
      const r = await fetch("/api/chess/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves, reply: true }),
      });
      const data = await json<ChessMoveResponse>(r);
      if (id !== gameId.current) return; // a new game started while this one was thinking
      if (data.ok) {
        setGame(data);
        setLastReply(data.reply);
        setPhase("ready");
      } else {
        setError(data.error);
        setPhase("error");
      }
    } catch {
      if (id !== gameId.current) return;
      setError("Couldn't reach the board. Check your connection and try that move again.");
      setPhase("error");
    }
  }

  function play(uci: string) {
    setSelected(null);
    setPromo(null);
    void send([...game.moves, uci]);
  }

  function newGame(color: Color) {
    gameId.current += 1;
    setGame(START);
    setPlayer(color);
    setSelected(null);
    setPromo(null);
    setLastReply(null);
    setError(null);
    setPhase("ready");
    setFocusSq(sqIndex(color === "white" ? "e2" : "e7"));
    if (color === "black") void send([]);
  }

  function clickSquare(sq: number) {
    setFocusSq(sq);
    if (!myTurn) return;
    if (selected !== null && targets.has(sq)) {
      const moves = from(selected).filter((m) => m.slice(2, 4) === sqName(sq));
      if (moves.length > 1) setPromo({ from: sqName(selected), to: sqName(sq) });
      else play(moves[0]);
      return;
    }
    const p = board[sq];
    setPromo(null);
    setSelected(p && p.color === myColor && from(sq).length > 0 && sq !== selected ? sq : null);
  }

  // One tab stop for the whole board; arrow keys move around it.
  function onBoardKey(e: KeyboardEvent<HTMLDivElement>) {
    const flip = player === "black" ? -1 : 1;
    const step: Record<string, [number, number]> = {
      ArrowUp: [0, 1 * flip],
      ArrowDown: [0, -1 * flip],
      ArrowLeft: [-1 * flip, 0],
      ArrowRight: [1 * flip, 0],
    };
    const d = step[e.key];
    if (!d) return;
    e.preventDefault();
    const file = Math.min(7, Math.max(0, (focusSq % 8) + d[0]));
    const rank = Math.min(7, Math.max(0, Math.floor(focusSq / 8) + d[1]));
    const next = rank * 8 + file;
    setFocusSq(next);
    boardRef.current?.querySelector<HTMLButtonElement>(`[data-sq="${next}"]`)?.focus();
  }

  const order: number[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rank = player === "white" ? 7 - row : row;
      const file = player === "white" ? col : 7 - col;
      order.push(rank * 8 + file);
    }
  }

  let statusLine: string;
  if (phase === "error" && error) statusLine = error;
  else if (game.outcome.over) statusLine = outcomeText(game, player);
  else if (phase === "thinking") statusLine = "Jewel is thinking…";
  else if (game.turn === player) statusLine = game.check ? "Your move. You're in check." : "Your move.";
  else statusLine = "Waiting for Jewel.";

  const pairs: Array<[number, string, string | undefined]> = [];
  for (let i = 0; i < game.san.length; i += 2) pairs.push([i / 2 + 1, game.san[i], game.san[i + 1]]);

  return (
    <div className="ch">
      <div ref={boardRef} className="ch-board" role="group" aria-label={`Chess board, you play ${player}`} onKeyDown={onBoardKey}>
        {order.map((sq) => {
          const p = board[sq];
          const dark = (Math.floor(sq / 8) + (sq % 8)) % 2 === 0;
          const name = sqName(sq);
          const label = p ? `${name}, ${p.color === "w" ? "white" : "black"} ${NAME[p.type]}` : name;
          const isTarget = targets.has(sq);
          const showFile = Math.floor(sq / 8) === (player === "white" ? 0 : 7);
          const showRank = sq % 8 === (player === "white" ? 0 : 7);
          return (
            <button
              key={sq}
              type="button"
              className="ch-sq"
              data-sq={sq}
              data-dark={dark}
              data-sel={selected === sq}
              data-target={isTarget}
              data-occupied={Boolean(p)}
              data-last={lastSquares.has(sq)}
              data-check={kingInCheck === sq}
              data-can={myTurn && (isTarget || (p?.color === myColor && from(sq).length > 0))}
              tabIndex={focusSq === sq ? 0 : -1}
              aria-label={isTarget ? `${label}, move here` : label}
              aria-pressed={selected === sq}
              onClick={() => clickSquare(sq)}
            >
              {p ? (
                <span className="ch-piece" data-color={p.color} aria-hidden="true">
                  {GLYPH[p.type] + TEXT}
                </span>
              ) : null}
              {showFile ? <span className="ch-coord ch-coord-file" aria-hidden="true">{name[0]}</span> : null}
              {showRank ? <span className="ch-coord ch-coord-rank" aria-hidden="true">{name[1]}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="ch-side">
        <p className="ch-status" role="status" aria-live="polite">
          {statusLine}
          {lastReply?.by === "random" && !game.outcome.over && phase !== "thinking" ? (
            <span className="ch-note" style={{ display: "block", marginTop: "var(--space-2)" }}>
              Jewel played {lastReply.san} at random.
            </span>
          ) : null}
        </p>

        {promo ? (
          <div className="ch-promo" role="group" aria-label="Promote to">
            <span className="md-label">Promote to</span>
            {["q", "r", "b", "n"].map((t) => (
              <button key={t} type="button" aria-label={NAME[t]} onClick={() => play(`${promo.from}${promo.to}${t}`)}>
                <span className="ch-piece" data-color={myColor} aria-hidden="true">
                  {GLYPH[t] + TEXT}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="ch-actions">
          <Button variant="primary" size="sm" onClick={() => newGame("white")}>
            New game as white
          </Button>
          <Button size="sm" onClick={() => newGame("black")}>
            New game as black
          </Button>
        </div>

        {pairs.length ? (
          <ol className="ch-moves" aria-label="Moves">
            {pairs.map(([n, w, b]) => (
              <li key={n}>
                <span className="ch-no">{n}.</span>
                <span>{w}</span>
                <span>{b ?? ""}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <p className="ch-note">{engineNote(status)}</p>
      </div>
    </div>
  );
}
