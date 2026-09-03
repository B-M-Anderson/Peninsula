import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { redis, relayConfigured } from "../concierge/upstash";
import { DARKROOM_MAX_UPLOAD_BYTES as MAX_UPLOAD_BYTES } from "../../data/site";
import { sameSecret } from "../../lib/secret";
import type { PhotosResponse, UploadResponse } from "../../lib/api-types";

// Photo gallery backed by Vercel Blob.
// - GET: public list of uploaded photos (prefix gallery/)
// - POST: upload, gated by DARKROOM_CODE (server-side env var — real auth,
//   unlike the vault easter egg). Requires BLOB_READ_WRITE_TOKEN, which Vercel
//   injects automatically once a Blob store is attached to the project.

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Failed code attempts per address before a cool-down (only when the Upstash
// relay is configured; without it the check is the constant-time compare alone).
const FAIL_LIMIT = 5;
const FAIL_WINDOW_S = 600;

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** What the bytes say the file is — the browser-supplied type is only a claim. */
async function sniffImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const at = (i: number, ...bytes: number[]) => bytes.every((b, j) => head[i + j] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

export async function GET() {
  if (!blobConfigured()) {
    return NextResponse.json({ configured: false, photos: [] } satisfies PhotosResponse);
  }
  try {
    const { blobs } = await list({ prefix: "gallery/" });
    const photos = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map((b) => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt }));
    return NextResponse.json(
      { configured: true, photos },
      // Ordinary visits are served from the CDN for a minute; right after an
      // upload the page re-fetches with a cache-busting query so the new print
      // shows up at once.
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({ configured: true, photos: [], error: "list failed" } satisfies PhotosResponse, { status: 502 });
  }
}

export async function POST(req: Request) {
  if (!blobConfigured()) {
    return NextResponse.json(
      { error: "darkroom not developed yet — storage not provisioned" },
      { status: 503 }
    );
  }
  const expected = process.env.DARKROOM_CODE;
  if (!expected) {
    return NextResponse.json({ error: "darkroom code not configured" }, { status: 503 });
  }

  const ip = clientIp(req);
  const failKey = `darkroom:fail:${ip}`;
  if (relayConfigured()) {
    try {
      const fails = Number((await redis(["GET", failKey], 2000)) ?? 0);
      if (fails >= FAIL_LIMIT) {
        return NextResponse.json({ error: "too many attempts — try again later" }, { status: 429 });
      }
    } catch {
      /* relay hiccup: fall through to the code check */
    }
  }

  const provided = req.headers.get("x-darkroom-code") ?? "";
  if (!sameSecret(provided, expected)) {
    if (relayConfigured()) {
      // Awaited, and the window is created together with its expiry (SET NX EX)
      // so a lost follow-up command can never leave a counter with no TTL —
      // that would lock the address out until someone cleared the key by hand.
      try {
        await redis(["SET", failKey, 0, "EX", FAIL_WINDOW_S, "NX"], 2000);
        await redis(["INCR", failKey], 2000);
      } catch {
        /* relay hiccup: the compare above is still the gate */
      }
    }
    return NextResponse.json({ error: "access denied" }, { status: 401 });
  }
  // A good code clears earlier typos from the same address.
  if (relayConfigured()) redis(["DEL", failKey], 2000).catch(() => {});

  // Refuse oversized bodies before buffering them.
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 4096) {
    return NextResponse.json({ error: "file too large (4 MB max)" }, { status: 413 });
  }

  let file: File;
  try {
    const form = await req.formData();
    const f = form.get("photo");
    if (!(f instanceof File)) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }
    file = f;
  } catch {
    return NextResponse.json({ error: "expected a multipart form" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file too large (4 MB max)" }, { status: 413 });
  }
  const type = await sniffImageType(file);
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: "not a JPEG, PNG, WebP or GIF" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  try {
    const blob = await put(`gallery/${Date.now()}-${safeName}`, file, {
      access: "public",
      contentType: type,
      addRandomSuffix: true,
    });
    return NextResponse.json({ ok: true, url: blob.url } satisfies UploadResponse);
  } catch (err) {
    console.error("darkroom upload failed", err);
    return NextResponse.json({ error: "upload failed — try again" }, { status: 502 });
  }
}
