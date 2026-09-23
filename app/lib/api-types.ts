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
  cache?: { entries?: number; hits?: number } | null;
  idle?: { precomputed?: number; improved?: number } | null;
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
  cache?: { entries?: number; hits?: number } | null;
  idle?: { precomputed?: number; improved?: number } | null;
  /** Online: when these numbers were read (now). Offline: the last live reading, or null if there has never been one. */
  lastSeen?: LastSeen | null;
};

/** One of: an answer, a soft refusal (limited / busy), the fast-lane unlock, or offline. */
export type AskResponse = {
  online: boolean;
  canned?: boolean;
  answer: string | null;
  limited?: true;
  busy?: true;
  unlocked?: true;
};

export type ProgressResponse = {
  state: string;
  ahead?: number;
  via?: string | null;
  ms?: number | null;
};

export type Photo = { url: string; pathname: string; uploadedAt: string };

export type PhotosResponse = {
  configured: boolean;
  photos: Photo[];
  error?: string;
};

export type UploadResponse = { ok?: true; url?: string; error?: string };

/** `fetch(...).then(json<T>)` — one place to say what a response is. */
export function json<T>(r: Response): Promise<T> {
  return r.json() as Promise<T>;
}
