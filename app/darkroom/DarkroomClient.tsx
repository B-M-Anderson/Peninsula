"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button, Card } from "../components/ui";
import { DARKROOM_MAX_UPLOAD_BYTES } from "../data/site";
import { json, type Photo, type PhotosResponse, type UploadResponse } from "../lib/api-types";

type Gallery = { loading: boolean; configured: boolean; photos: Photo[]; error: boolean };
// The one status line under the form: what it says, and whether it is a
// problem, progress or a result — the colour and the focus move follow.
type Msg = { text: string; tone: "error" | "busy" | "ok" };

const MAX_MB = Math.round(DARKROOM_MAX_UPLOAD_BYTES / (1024 * 1024));

function printDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const field = {
  background: "var(--surface-sunken)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  fontFamily: "var(--font-body)",
  color: "var(--text-body)",
  outline: "none",
  minWidth: 0,
};

export default function DarkroomClient() {
  const [gallery, setGallery] = useState<Gallery>({ loading: true, configured: false, photos: [], error: false });
  const [station, setStation] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<Msg | null>(null);
  const [invalid, setInvalid] = useState<"file" | "code" | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // `fresh` adds a cache-busting query: the CDN keys on the URL and would
  // otherwise hand back the list it cached a moment before the upload.
  const refresh = (signal?: AbortSignal, fresh = false) =>
    fetch(fresh ? `/api/photos?fresh=${Date.now()}` : "/api/photos", { signal, cache: fresh ? "no-store" : "default" })
      .then(json<PhotosResponse>)
      .then((data) =>
        setGallery((g) =>
          data.error
            ? // keep whatever is already on the wall; just flag that the list call failed
              { ...g, loading: false, configured: Boolean(data.configured), error: true }
            : { loading: false, configured: Boolean(data.configured), photos: data.photos ?? [], error: false }
        )
      )
      .catch((err) => {
        if ((err as { name?: string })?.name === "AbortError") return;
        setGallery((g) => ({ ...g, loading: false, error: true }));
      });

  useEffect(() => {
    const ctrl = new AbortController();
    refresh(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    const fail = (text: string, field: "file" | "code") => {
      setMsg({ text, tone: "error" });
      setInvalid(field);
      (field === "file" ? fileRef : codeRef).current?.focus();
    };
    if (!file) return fail("Pick a file first.", "file");
    if (file.size > DARKROOM_MAX_UPLOAD_BYTES) return fail(`That print is too large — ${MAX_MB} MB is the ceiling.`, "file");
    if (!code) return fail("Access code required.", "code");
    setInvalid(null);
    setBusy(true);
    setMsg({ text: "Developing…", tone: "busy" });
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "x-darkroom-code": code },
        body: form,
      });
      const data = await json<UploadResponse>(res).catch((): UploadResponse => ({ error: `HTTP ${res.status}` }));
      if (res.ok) {
        setMsg({ text: "Developed. It's on the wall.", tone: "ok" });
        if (fileRef.current) fileRef.current.value = "";
        // Show the new print immediately, then reconcile with the store.
        const url = data.url;
        if (url) {
          setGallery((g) => ({
            ...g,
            configured: true,
            photos: [{ url, pathname: `gallery/${Date.now()}-${file.name}`, uploadedAt: new Date().toISOString() }, ...g.photos],
          }));
        }
        refresh(undefined, true);
      } else {
        setMsg({ text: `Rejected: ${data.error ?? `HTTP ${res.status}`}.`, tone: "error" });
        if (res.status === 401) setInvalid("code");
      }
    } catch {
      setMsg({ text: "The print didn't make it. Try again.", tone: "error" });
    }
    setBusy(false);
  };

  const count = gallery.photos.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-5)", flexWrap: "wrap" }}>
        <p style={{ margin: 0, maxWidth: "var(--measure)", fontSize: "var(--text-lg)", lineHeight: "var(--leading-relaxed)", color: "var(--text-muted)" }}>
          Anyone can look; only the keeper of the code can hang new prints.
        </p>
        <button
          type="button"
          className="md-link"
          aria-expanded={station}
          aria-controls="develop-station"
          onClick={() => setStation((s) => !s)}
        >
          Keeper&rsquo;s entrance <span aria-hidden>{station ? "−" : "+"}</span>
        </button>
      </div>

      {station && (
        <Card className="md-fade-in">
          <form
            id="develop-station"
            aria-busy={busy}
            onSubmit={(e) => {
              e.preventDefault();
              upload();
            }}
            style={{ display: "grid", gap: "var(--space-5)", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", alignItems: "end" }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
              <span className="md-label">Print · JPEG, PNG, WebP or GIF · {MAX_MB} MB max</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-invalid={invalid === "file" || undefined}
                onChange={() => setInvalid((v) => (v === "file" ? null : v))}
                disabled={busy}
                style={{ ...field, fontSize: "var(--text-sm)" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
              <span className="md-label">Access code</span>
              <input
                ref={codeRef}
                type="password"
                value={code}
                aria-invalid={invalid === "code" || undefined}
                onChange={(e) => {
                  setCode(e.target.value);
                  setInvalid((v) => (v === "code" ? null : v));
                }}
                autoComplete="current-password"
                disabled={busy}
                style={field}
              />
            </label>
            <div>
              <Button type="submit" variant="primary" disabled={busy} iconLeft={<Upload size={15} />}>
                Develop
              </Button>
            </div>
            <p
              role="status"
              aria-live="polite"
              style={{ margin: 0, gridColumn: "1 / -1", fontSize: "var(--text-sm)", color: msg?.tone === "error" ? "var(--status-wip-text)" : "var(--text-muted)", minHeight: "1.4em" }}
            >
              {msg?.text}
            </p>
            {!gallery.loading && !gallery.configured && !gallery.error ? (
              <p style={{ margin: 0, gridColumn: "1 / -1", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>
                Storage isn&rsquo;t set up yet, so nothing can be hung.
              </p>
            ) : null}
          </form>
        </Card>
      )}

      <section aria-labelledby="wall-heading">
        <h2 id="wall-heading" className="md-label" style={{ margin: "0 0 var(--space-5)" }}>
          The wall{gallery.loading ? "" : ` · ${count} ${count === 1 ? "print" : "prints"}`}
        </h2>
        {gallery.loading && (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-faint)" }}>Loading prints…</p>
        )}
        {!gallery.loading && gallery.error && (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Couldn&rsquo;t reach the wall just now — try again in a moment.
          </p>
        )}
        {!gallery.loading && !gallery.error && count === 0 && (
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>The wall is bare.</p>
        )}
        {count > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: "var(--space-5)" }}>
            {gallery.photos.map((photo, i) => (
              <figure key={photo.pathname} style={{ margin: 0 }}>
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open print ${i + 1} full size (opens in a new tab)`}
                  style={{ display: "block", position: "relative", aspectRatio: "1", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--surface-sunken)" }}
                >
                  <Image
                    src={photo.url}
                    alt={`Darkroom print ${i + 1}`}
                    fill
                    sizes="(min-width: 1180px) 360px, (min-width: 640px) 33vw, 50vw"
                    style={{ objectFit: "cover" }}
                  />
                </a>
                <figcaption style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--text-faint)", marginTop: "var(--space-4)" }}>
                  print_{String(i + 1).padStart(3, "0")}
                  {printDate(photo.uploadedAt) ? ` · ${printDate(photo.uploadedAt)}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
