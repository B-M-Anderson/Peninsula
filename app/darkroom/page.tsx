"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Photo = { url: string; pathname: string; uploadedAt: string };
type Gallery = { loading: boolean; configured: boolean; photos: Photo[] };

export default function DarkroomPage() {
  const [gallery, setGallery] = useState<Gallery>({ loading: true, configured: false, photos: [] });
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((data) => setGallery({ loading: false, configured: data.configured, photos: data.photos ?? [] }))
      .catch(() => setGallery({ loading: false, configured: false, photos: [] }));
  };

  useEffect(refresh, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { setMsg("pick a file first"); return; }
    if (!code) { setMsg("access code required"); return; }
    setBusy(true);
    setMsg("developing…");
    try {
      const form = new FormData();
      form.append("photo", file);
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "x-darkroom-code": code },
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("developed. it's on the wall.");
        if (fileRef.current) fileRef.current.value = "";
        refresh();
      } else {
        setMsg(`rejected: ${data.error}`);
      }
    } catch {
      setMsg("transmission failed");
    }
    setBusy(false);
  };

  return (
    <div className="max-w-4xl mx-auto pt-24 pb-16 px-6 font-term">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-bio-green dark:text-phos glow glitch">
          &gt; darkroom
        </h1>
        <p className="text-sm opacity-70 mt-3 max-w-xl leading-relaxed">
          field observations, developed on site. anyone can look; only the
          keeper of the code can hang new prints.
        </p>

        {/* upload station */}
        <div className="mt-8 text-sm space-y-3">
          <p className="opacity-50">&gt; develop --new</p>
          <div className="pl-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-xs opacity-80 file:font-term file:text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-bio-green/15 file:text-bio-green dark:file:bg-phos/15 dark:file:text-phos file:cursor-pointer"
            />
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="access code"
              className="bg-transparent border-b border-bio-line dark:border-phos/30 outline-none text-sm w-40 placeholder:opacity-30"
              autoComplete="off"
            />
            <button
              onClick={upload}
              disabled={busy}
              className="text-left opacity-70 hover:opacity-100 hover:glow transition disabled:opacity-30"
            >
              [develop]
            </button>
          </div>
          {msg && <p className="pl-4 opacity-60">{"// "}{msg}</p>}
          {!gallery.loading && !gallery.configured && (
            <p className="pl-4 opacity-40">
              {"// darkroom chemicals not yet delivered — storage isn't provisioned. uploads will work once the site has a blob store attached."}
            </p>
          )}
        </div>

        {/* the wall */}
        <div className="mt-12">
          <p className="opacity-50 text-sm mb-4">&gt; ls prints/ ({gallery.photos.length})</p>
          {gallery.loading && <p className="text-sm opacity-40 pl-4">developing<span className="cursor-blink">▮</span></p>}
          {!gallery.loading && gallery.photos.length === 0 && (
            <p className="text-sm opacity-40 pl-4">[ the wall is bare ]</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {gallery.photos.map((photo) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={photo.pathname}
                src={photo.url}
                alt={photo.pathname.replace("gallery/", "")}
                className="rounded object-cover w-full aspect-square"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
