import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

// Photo gallery backed by Vercel Blob.
// - GET: public list of uploaded photos (prefix gallery/)
// - POST: upload, gated by DARKROOM_CODE (server-side env var — real auth,
//   unlike the vault easter egg). Requires BLOB_READ_WRITE_TOKEN, which Vercel
//   injects automatically once a Blob store is attached to the project.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function GET() {
  if (!blobConfigured()) {
    return NextResponse.json({ configured: false, photos: [] });
  }
  try {
    const { blobs } = await list({ prefix: "gallery/" });
    const photos = blobs
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map((b) => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt }));
    return NextResponse.json({ configured: true, photos });
  } catch {
    return NextResponse.json({ configured: true, photos: [], error: "list failed" });
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
  const provided = req.headers.get("x-darkroom-code") ?? "";
  if (provided !== expected) {
    return NextResponse.json({ error: "access denied" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `type ${file.type} not allowed` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (8 MB max)" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`gallery/${Date.now()}-${safeName}`, file, {
    access: "public",
  });
  return NextResponse.json({ ok: true, url: blob.url });
}
