import { NextResponse } from "next/server";
import { CONCIERGE } from "../../../data/site";
import { redis, relayConfigured, KEYS } from "../upstash";

// Concierge node status. Reads the desktop node's heartbeat directly from the
// Upstash relay. No relay env set -> honestly reports "not yet provisioned".
// Heartbeat present -> online; missing/expired (TTL ~30s) -> node asleep/offline.

export const revalidate = 0;

export async function GET() {
  if (!relayConfigured()) {
    return NextResponse.json({
      online: false,
      provisioned: false,
      model: null,
      runtime: CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      note: "desktop node not yet provisioned",
    });
  }

  try {
    const t0 = Date.now();
    const raw = await redis(["GET", KEYS.heartbeat], 4000);
    const latencyMs = Date.now() - t0;

    if (!raw) {
      return NextResponse.json({
        online: false,
        provisioned: true,
        model: null,
        runtime: CONCIERGE.plannedRuntime,
        host: CONCIERGE.host,
        note: "desktop node unreachable (powered down or asleep)",
      });
    }

    const beat = JSON.parse(String(raw)) as {
      model?: string;
      runtime?: string;
      ts?: number;
      machine?: { cpu?: string; cores?: number; ramGb?: number; gpu?: string | null };
      cache?: { entries?: number; hits?: number };
      idle?: { precomputed?: number; improved?: number };
    };
    return NextResponse.json({
      online: true,
      provisioned: true,
      model: beat.model ?? "unknown",
      runtime: beat.runtime ?? CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      latencyMs,
      // Optional — an older node that predates these fields simply omits them,
      // and the page hides the panel rather than showing blanks.
      machine: beat.machine ?? null,
      cache: beat.cache ?? null,
      idle: beat.idle ?? null,
    });
  } catch {
    return NextResponse.json({
      online: false,
      provisioned: true,
      model: null,
      runtime: CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      note: "desktop node unreachable",
    });
  }
}
