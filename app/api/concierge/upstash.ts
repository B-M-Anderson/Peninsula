// Minimal Upstash Redis REST client for the concierge routes. Outbound HTTPS only.
// The desktop node reaches the same DB; these routes only enqueue jobs + read
// answers/heartbeat. Never import this into client components.

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const relayConfigured = (): boolean => Boolean(REST_URL && REST_TOKEN);

export const KEYS = {
  jobs: "concierge:jobs",
  heartbeat: "concierge:heartbeat",
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
