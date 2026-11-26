// The chess node is the desktop at home (~/chess-host on the OptiPlex), reached
// over its Tailscale Funnel address. Both values are server-only env:
//   CHESS_NODE_URL       the node's public /chess base URL
//   CHESS_SHARED_SECRET  must match CHESS_SHARED_SECRET in ~/chess-host/chess.env
// Unset -> the page says the board isn't set up, and no request leaves Vercel.

export function chessConfigured(): boolean {
  return Boolean(process.env.CHESS_NODE_URL && process.env.CHESS_SHARED_SECRET);
}

export async function chessNode(path: "/status" | "/move", init: RequestInit = {}, timeoutMs = 20000): Promise<Response> {
  const base = (process.env.CHESS_NODE_URL ?? "").replace(/\/+$/, "");
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Chess-Secret": process.env.CHESS_SHARED_SECRET ?? "",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
}
