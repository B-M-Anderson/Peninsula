"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button, Card } from "../components/ui";
import { DARKROOM_MAX_UPLOAD_BYTES } from "../data/site";

type Photo = { url: string; pathname: string; uploadedAt: string };
type Gallery = { loading: boolean; configured: boolean; photos: Photo[]; error: boolean };

const MAX_MB = Math.round(DARKROOM_MAX_UPLOAD_BYTES / (1024 * 1024));

function printDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const label = {
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-3xs)",
  letterSpacing: "var(--tracking-label)",
  textTransform: "uppercase" as const,
  color: "var(--text-faint)",
};

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
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // `fresh` adds a cache-busting query: the CDN keys on the URL and would
  // otherwise hand back the list it cached a moment before the upload.
  const refresh = (signal?: AbortSignal, fresh = false) =>
    fetch(fresh ? `/api/photos?fresh=${Date.now()}` : "/api/photos", { signal, cache: fresh ? "no-store" : "default" })
      .then((r) => r.json())
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
    if (!file) {
      setMsg("Pick a file first.");
      return;
    }
    if (file.size > DARKROOM_MAX_UPLOAD_BYTES) {
      setMsg(`That print is too large — ${MAX_MB} MB is the ceiling.`);
      return;
    }
    if (!code) {
      setMsg("Access code required.");
      return;
    }
    setBusy(true);
    setMsg("Developing…");
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "x-darkroom-code": code },
        body: form,
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      if (res.ok) {
        setMsg("Developed. It's on the wall.");
        if (fileRef.current) fileRef.current.value = "";
        // Show the new print immediately, then reconcile with the store.
        if (data.url) {
          setGallery((g) => ({
            ...g,
            configured: true,
            photos: [{ url: data.url, pathname: `gallery/${Date.now()}-${file.name}`, uploadedAt: new Date().toISOString() }, ...g.photos],
          }));
        }
        refresh(undefined, true);
      } else {
        setMsg(`Rejected: ${data.error ?? `HTTP ${res.status}`}.`);
      }
    } catch {
      setMsg("The print didn't make it. Try again.");
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
          style={{ background: "none", border: 0, padding: 0, cursor: "pointer", borderBottom: "1px solid transparent" }}
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
              <span style={label}>Print · JPEG, PNG, WebP or GIF · {MAX_MB} MB max</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={busy}
                style={{ ...field, fontSize: "var(--text-sm)" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", minWidth: 0 }}>
              <span style={label}>Access code</span>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
            <p role="status" aria-live="polite" style={{ margin: 0, gridColumn: "1 / -1", fontSize: "var(--text-sm)", color: "var(--text-muted)", minHeight: "1.4em" }}>
              {msg}
              {!gallery.loading && !gallery.configured && !gallery.error
                ? " Storage isn't set up yet, so nothing can be hung."
                : null}
            </p>
          </form>
        </Card>
      )}

      <section aria-labelledby="wall-heading">
        <h2 id="wall-heading" style={{ ...label, margin: "0 0 var(--space-5)" }}>
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
