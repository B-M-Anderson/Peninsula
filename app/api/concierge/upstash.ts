// Minimal Upstash Redis REST client for the concierge routes. Outbound HTTPS only.
// The desktop node reaches the same DB; these routes only enqueue jobs + read
// answers/heartbeat. Never import this into client components.

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const relayConfigured = (): boolean => Boolean(URL && TOKEN);

export const KEYS = {
  jobs: "concierge:jobs",
  heartbeat: "concierge:heartbeat",
  answer: (id: string) => `concierge:answer:${id}`,
  progress: (id: string) => `concierge:progress:${id}`,
};

// Run one Redis command via the Upstash REST endpoint. Throws on transport/relay error.
export async function redis(
  command: (string | number)[],
  timeoutMs = 5000,
): Promise<unknown> {
  if (!URL || !TOKEN) throw new Error("relay not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
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
