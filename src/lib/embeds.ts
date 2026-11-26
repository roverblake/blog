/** Recognizes YouTube and Vimeo links. Returns null for anything else. */
export type VideoRef = { provider: "youtube" | "vimeo"; id: string };

export function parseVideoUrl(raw: string): VideoRef | null {
  let u: URL;
  try {
    u = new URL(raw.trim().match(/^https?:/) ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const ytId = /^[A-Za-z0-9_-]{11}$/;
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return ytId.test(id) ? { provider: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "music.youtube.com") {
    const v = u.searchParams.get("v");
    if (v && ytId.test(v)) return { provider: "youtube", id: v };
    const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    return m ? { provider: "youtube", id: m[1] } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);
    return m ? { provider: "vimeo", id: m[1] } : null;
  }
  return null;
}

export function isValidVideo(provider: unknown, id: unknown): provider is "youtube" | "vimeo" {
  if (provider === "youtube") return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id);
  if (provider === "vimeo") return typeof id === "string" && /^\d{6,12}$/.test(id);
  return false;
}

export function videoWatchUrl(provider: "youtube" | "vimeo", id: string) {
  return provider === "youtube" ? `https://www.youtube.com/watch?v=${id}` : `https://vimeo.com/${id}`;
}

/** Privacy-friendly player addresses (no cookies until the reader presses play). */
export function videoEmbedUrl(provider: "youtube" | "vimeo", id: string) {
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
}

/** Thumbnail served through this site, so readers' browsers never contact YouTube until they press play. */
export function videoThumbUrl(provider: "youtube" | "vimeo", id: string) {
  return provider === "youtube" ? `/video-thumb/${id}` : null;
}
