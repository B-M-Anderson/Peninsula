import { NextResponse } from "next/server";
import { CONCIERGE } from "../../../data/site";

// Concierge node status. When the desktop relay comes online, set
// CONCIERGE_STATUS_URL (Vercel env var) to its heartbeat endpoint; until then
// this honestly reports the node as offline.

export const revalidate = 0;

export async function GET() {
  const heartbeatUrl = process.env.CONCIERGE_STATUS_URL;

  if (!heartbeatUrl) {
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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(heartbeatUrl, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`heartbeat ${res.status}`);
    const data = await res.json();
    return NextResponse.json({
      online: true,
      provisioned: true,
      model: data.model ?? "unknown",
      runtime: data.runtime ?? CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      latencyMs: data.latencyMs ?? null,
    });
  } catch {
    return NextResponse.json({
      online: false,
      provisioned: true,
      model: null,
      runtime: CONCIERGE.plannedRuntime,
      host: CONCIERGE.host,
      note: "desktop node unreachable (powered down or asleep)",
    });
  }
}
