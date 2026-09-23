import { dappleSvg } from "../lib/dapple";

// A new random dot field for every page load (see app/lib/dapple.ts).
export const dynamic = "force-dynamic";

export function GET() {
  return new Response(dappleSvg(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store",
    },
  });
}
