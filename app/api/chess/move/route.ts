import { NextResponse } from "next/server";
import type { ChessMoveResponse } from "../../../lib/api-types";
import { chessConfigured, chessNode } from "../node";

// Forwards one turn to the desktop node. Only the move list and the reply flag
// pass through, and the node re-checks every move from the start position, so
// nothing a visitor sends here can put an illegal position on the board.
export const revalidate = 0;

const MAX_PLIES = 600;
const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export async function POST(req: Request) {
  if (!chessConfigured()) {
    return NextResponse.json({ ok: false, error: "The chess board isn't set up yet.", offline: true } satisfies ChessMoveResponse, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body." } satisfies ChessMoveResponse, { status: 400 });
  }
  const b = (body ?? {}) as { moves?: unknown; reply?: unknown };
  const moves = Array.isArray(b.moves) ? b.moves : null;
  if (!moves || moves.length > MAX_PLIES || !moves.every((m) => typeof m === "string" && UCI.test(m))) {
    return NextResponse.json({ ok: false, error: "moves must be a list of UCI moves." } satisfies ChessMoveResponse, { status: 400 });
  }
  try {
    const r = await chessNode("/move", { method: "POST", body: JSON.stringify({ moves, reply: b.reply !== false, movetime: 1000 }) });
    const data = (await r.json()) as ChessMoveResponse;
    return NextResponse.json(data, { status: r.status });
  } catch {
    return NextResponse.json({ ok: false, error: "The desktop that runs the bot is off or unreachable right now.", offline: true } satisfies ChessMoveResponse, { status: 503 });
  }
}
