import { NextResponse } from "next/server";
import { CONCIERGE } from "../../../data/site";
import { redis, relayConfigured, KEYS } from "../upstash";
import type { LastSeen, StatusResponse } from "../../../lib/api-types";

// Concierge node status. Reads the desktop node's heartbeat directly from the
// Upstash relay. No relay env set -> honestly reports "not yet provisioned".
// Heartbeat present -> online; missing/expired (TTL ~30s) -> node asleep/offline.
//
// Every live reading is also copied to KEYS.lastSeen with no expiry, so while
// the desktop is off the page can still show its numbers, marked with when
// they were read, instead of a panel of blanks.

export const revalidate = 0;

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
    const raw = await redis(["GET", KEYS.lastSeen], 3000);
    return raw ? (JSON.parse(String(raw)) as LastSeen) : null;
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
    const raw = await redis(["GET", KEYS.heartbeat], 4000);
    const latencyMs = Date.now() - t0;

    if (!raw) {
      return NextResponse.json(offline("desktop node unreachable (powered down or asleep)", await readLastSeen()) satisfies StatusResponse);
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
    await redis(["SET", KEYS.lastSeen, JSON.stringify(lastSeen)], 3000).catch(() => {});
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
