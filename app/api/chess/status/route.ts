import { NextResponse } from "next/server";
import type { ChessStatusResponse } from "../../../lib/api-types";
import { chessConfigured, chessNode } from "../node";

// Is the desktop up, and which Jewel build is it running.
export const revalidate = 0;

export async function GET() {
  if (!chessConfigured()) {
    return NextResponse.json({ online: false, note: "not set up yet" } satisfies ChessStatusResponse);
  }
  try {
    const r = await chessNode("/status", {}, 6000);
    if (!r.ok) throw new Error(String(r.status));
    const s = (await r.json()) as Omit<ChessStatusResponse, "online">;
    return NextResponse.json({ online: true, engine: s.engine, build: s.build } satisfies ChessStatusResponse);
  } catch {
    return NextResponse.json({ online: false, note: "the desktop is off or unreachable" } satisfies ChessStatusResponse);
  }
}
