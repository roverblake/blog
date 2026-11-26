"use client";

import { useState } from "react";

/**
 * Click-to-play video. Until the reader presses play, nothing is loaded from
 * YouTube or Vimeo (no cookies, no tracking); the still comes via this site.
 */
export function VideoEmbed({ embedUrl, thumb, label }: { embedUrl: string; thumb: string | null; label: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <span className="video-frame">
        <iframe
          src={embedUrl}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </span>
    );
  }
  return (
    <button type="button" className="video-frame" onClick={() => setPlaying(true)} aria-label={`Play video: ${label}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {thumb && (
        <img src={thumb} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} />
      )}
      <span className="video-play" aria-hidden="true" />
    </button>
  );
}
