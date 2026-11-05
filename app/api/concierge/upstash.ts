// Minimal Upstash Redis REST client for the concierge routes. Outbound HTTPS only.
// The desktop node reaches the same DB; these routes only enqueue jobs + read
// answers/heartbeat. Never import this into client components.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const relayConfigured = (): boolean => Boolean(REST_URL && REST_TOKEN);

export const KEYS = {
  jobs: "concierge:jobs",
  /** Extended answers queue here; the node takes this list only when the main one is empty. */
  extendedJobs: "concierge:jobs:extended",
  extendedRate: (ip: string) => `concierge:extrate:${ip}`,
  heartbeat: "concierge:heartbeat",
  /** The last live heartbeat's numbers, with no expiry: what /ask shows while the desktop is off. */
  lastSeen: "concierge:lastseen",
  answer: (id: string) => `concierge:answer:${id}`,
  progress: (id: string) => `concierge:progress:${id}`,
  rate: (ip: string) => `concierge:rate:${ip}`,
};

// Run one Redis command via the Upstash REST endpoint. Throws on transport/relay error.
export async function redis(
  command: (string | number)[],
  timeoutMs = 5000,
): Promise<unknown> {
  if (!REST_URL || !REST_TOKEN) throw new Error("relay not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command.map(String)),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`relay ${res.status}`);
    const data = (await res.json()) as { result?: unknown; error?: string };
    if (data.error) throw new Error(data.error);
    return data.result;
  } finally {
    clearTimeout(timer);
  }
}

// ---- Fixed-window counters ----------------------------------------------------
//
// Built on GET and SET ... EX only. The self-hosted relay implements a short list of
// commands: it refuses INCR and ignores SET's NX flag, so the usual "SET NX EX, then
// INCR" pattern fails every time, and callers that swallow relay errors then have no
// limit at all. The value carries its own window end, so bumping never extends it.
//
// GET-then-SET is not atomic, so simultaneous requests can undercount slightly. These
// counters stop floods and guessing, and a small undercount changes neither.

function parseWindow(raw: unknown): { count: number; resetAt: number } {
  const [count, resetAt] = String(raw ?? "").split(":").map(Number);
  return { count: count || 0, resetAt: resetAt || 0 };
}

/** How many times `key` has been bumped in its current window. Throws on a relay error. */
export async function readWindow(key: string, timeoutMs = 3000): Promise<number> {
  const { count, resetAt } = parseWindow(await redis(["GET", key], timeoutMs));
  return resetAt > Date.now() / 1000 ? count : 0;
}

/** Add one to `key`, starting a new window if needed, and return the new count. Throws on a relay error. */
export async function bumpWindow(key: string, windowSeconds: number, timeoutMs = 3000): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const current = parseWindow(await redis(["GET", key], timeoutMs));
  const live = current.resetAt > now;
  const count = (live ? current.count : 0) + 1;
  const resetAt = live ? current.resetAt : now + windowSeconds;
  await redis(["SET", key, `${count}:${resetAt}`, "EX", Math.max(1, resetAt - now)], timeoutMs);
  return count;
}
