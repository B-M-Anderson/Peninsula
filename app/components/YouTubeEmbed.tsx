"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

/** Pull the video id out of any of the shapes a YouTube link comes in. */
export function youTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Click-to-play YouTube embed. Shows the poster frame until the visitor asks
 * for the video, so a page with several videos doesn't pull the player's JS
 * (roughly half a megabyte per embed) for anyone who never presses play.
 */
export default function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // The poster button unmounts when the player mounts; keep keyboard focus
  // with the video instead of dropping it to <body>.
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);
  const frame = {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    border: "1px solid var(--border-subtle)",
    background: "var(--surface-sunken)",
  };

  if (playing) {
    return (
      <div style={frame}>
        <iframe
          ref={frameRef}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="md-video-poster"
      style={frame}
    >
      <Image
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, 560px"
        style={{ objectFit: "cover" }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(to top, rgba(27,16,7,0.55), rgba(27,16,7,0.05) 60%)",
        }}
      >
        <span className="md-video-play">
          <Play size={26} fill="currentColor" style={{ marginLeft: 3 }} />
        </span>
      </span>
    </button>
  );
}
