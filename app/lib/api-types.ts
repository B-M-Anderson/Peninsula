/**
 * The shapes the API routes return and the pages read. Routes `satisfies`
 * these; clients parse with `json<T>()`, so a field renamed on one side is a
 * type error on the other.
 */

export type Machine = { cpu?: string; cores?: number; ramGb?: number; gpu?: string | null };

/** What the desktop last reported, kept after its heartbeat expires so the page can still show it. */
export type LastSeen = {
  model: string | null;
  machine?: Machine | null;
  kb?: { updated?: string | null; sections?: number } | null;
  /** When these numbers were read from a live heartbeat (epoch ms). */
  at: number;
};

export type StatusResponse = {
  online: boolean;
  provisioned: boolean;
  model: string | null;
  runtime: string;
  host: string;
  note?: string;
  latencyMs?: number;
  machine?: Machine | null;
  kb?: { updated?: string | null; sections?: number } | null;
  /** What an extended answer means on the node right now, or false when it is off. */
  extended?: "thinking" | "careful" | false | null;
  /** Online: when these numbers were read (now). Offline: the last live reading, or null if there has never been one. */
  lastSeen?: LastSeen | null;
};

/** One of: an answer, a soft refusal (limited / busy), the fast-lane unlock, or offline. */
export type AskResponse = {
  online: boolean;
  canned?: boolean;
  answer: string | null;
  /** The job is in the queue; poll /progress with this id for its answer. */
  queued?: true;
  id?: string;
  limited?: true;
  /** The extended-answer budget for this address is spent; a normal question still works. */
  extendedLimited?: true;
  busy?: true;
  unlocked?: true;
};

export type ProgressResponse = {
  state: string;
  ahead?: number;
  via?: string | null;
  ms?: number | null;
  /** Present once, when the answer has landed. */
  answer?: string | null;
};

export type Photo = { url: string; pathname: string; uploadedAt: string };

export type PhotosResponse = {
  configured: boolean;
  photos: Photo[];
  error?: string;
};

export type UploadResponse = { ok?: true; url?: string; error?: string };

// ---- Chess (/chess, /api/chess/*) -------------------------------------------
// The board lives on the desktop node (~/chess-host on the OptiPlex): it
// referees every move and asks the Jewel engine for a reply. These routes only
// forward, so the node's address and shared secret never reach the browser.

export type ChessOutcome = {
  over: boolean;
  /** "1-0", "0-1", "1/2-1/2" */
  result: string | null;
  /** python-chess termination name: "checkmate", "stalemate", "insufficient_material", "threefold_repetition", ... */
  reason: string | null;
  winner?: "white" | "black" | null;
};

export type ChessGame = {
  fen: string;
  /** Every move so far, UCI ("e2e4", "e7e8q"). The node is stateless: the page sends this back each turn. */
  moves: string[];
  san: string[];
  turn: "white" | "black";
  check: boolean;
  /** Legal moves for the side to move, UCI. */
  legal: string[];
  outcome: ChessOutcome;
};

export type ChessReply = { uci: string; san: string; by: "jewel" | "random"; ms: number };

export type ChessMoveResponse =
  /** `reply.by: "random"` means Jewel could not answer and a random legal move stood in. */
  | ({ ok: true; reply: ChessReply | null } & ChessGame)
  | { ok: false; error: string; offline?: boolean };

export type ChessStatusResponse = {
  online: boolean;
  engine?: { state: "idle" | "starting" | "ready" | "missing" | "failed"; name: string | null; error: string | null };
  build?: {
    commit: string | null;
    message: string | null;
    committedAt: string | null;
    deployedAt: string | null;
    playable: boolean;
  };
  note?: string;
};

/** `fetch(...).then(json<T>)` — one place to say what a response is. */
export function json<T>(r: Response): Promise<T> {
  return r.json() as Promise<T>;
}
