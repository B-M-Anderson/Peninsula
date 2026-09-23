import { NextResponse } from "next/server";
import { CONCIERGE } from "../../../data/site";
import { redis, relayConfigured, KEYS } from "../upstash";
import type { LastSeen, StatusResponse } from "../../../lib/api-types";

// Concierge node status. Reads the desktop node's heartbeat directly from the
// Upstash relay. No relay env set -> honestly reports "not yet provisioned".
// Heartbeat present -> online; missing/expired (TTL ~30s) -> node asleep/offline.
//
// Live readings are also copied to KEYS.lastSeen with no expiry, so while the
// desktop is off the page can still show its numbers, marked with when they
// were read, instead of a panel of blanks. One MGET reads both keys; the copy
// is rewritten at most once a minute, so a poll usually costs one command.

export const revalidate = 0;

const LAST_SEEN_EVERY_MS = 60_000;

const parseLastSeen = (raw: unknown): LastSeen | null => {
  try {
    return raw ? (JSON.parse(String(raw)) as LastSeen) : null;
  } catch {
    return null;
  }
};

const offline = (note: string, lastSeen: LastSeen | null): StatusResponse => ({
  online: false,
  provisioned: true,
  model: null,
  runtime: CONCIERGE.plannedRuntime,
  host: CONCIERGE.host,
  note,
  lastSeen,
});

/** The stored last reading, or null. Never throws: a relay hiccup just means no numbers. */
async function readLastSeen(): Promise<LastSeen | null> {
  try {
    return parseLastSeen(await redis(["GET", KEYS.lastSeen], 3000));
  } catch {
    return null;
  }
}

export async function GET() {
  if (!relayConfigured()) {
    return NextResponse.json({
      online: false,
      provisioned: false,
      model: null,
      runtime: CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      note: "desktop node not yet provisioned",
    } satisfies StatusResponse);
  }

  try {
    const t0 = Date.now();
    const [raw, storedRaw] = (await redis(["MGET", KEYS.heartbeat, KEYS.lastSeen], 4000)) as [unknown, unknown];
    const latencyMs = Date.now() - t0;
    const stored = parseLastSeen(storedRaw);

    if (!raw) {
      return NextResponse.json(offline("desktop node unreachable (powered down or asleep)", stored) satisfies StatusResponse);
    }

    const beat = JSON.parse(String(raw)) as {
      model?: string;
      runtime?: string;
      ts?: number;
      machine?: { cpu?: string; cores?: number; ramGb?: number; gpu?: string | null };
      cache?: { entries?: number; hits?: number };
      idle?: { precomputed?: number; improved?: number };
    };
    const lastSeen: LastSeen = {
      model: beat.model ?? "unknown",
      // Optional — an older node that predates these fields simply omits them,
      // and the page hides what it doesn't have rather than showing blanks.
      machine: beat.machine ?? null,
      cache: beat.cache ?? null,
      idle: beat.idle ?? null,
      at: Date.now(),
    };
    // Best effort: a failed write only means the offline view shows an older reading.
    if (!stored || lastSeen.at - stored.at >= LAST_SEEN_EVERY_MS) {
      await redis(["SET", KEYS.lastSeen, JSON.stringify(lastSeen)], 3000).catch(() => {});
    }
    return NextResponse.json({
      online: true,
      provisioned: true,
      model: lastSeen.model,
      runtime: beat.runtime ?? CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      latencyMs,
      machine: lastSeen.machine,
      cache: lastSeen.cache,
      idle: lastSeen.idle,
      lastSeen,
    } satisfies StatusResponse);
  } catch {
    return NextResponse.json(offline("desktop node unreachable", await readLastSeen()) satisfies StatusResponse);
  }
}
