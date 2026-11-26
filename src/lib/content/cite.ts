/**
 * Quote sources are stored as plain text, with book titles marked by
 * asterisks: "C.S. Lewis, *The Screwtape Letters*". The editor shows them in
 * italics (Cmd/Ctrl+I); every renderer turns the marked parts into italics.
 */
export type CitePart = { text: string; italic: boolean };

export function citeParts(s: string | null | undefined): CitePart[] {
  if (!s) return [];
  const parts: CitePart[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) parts.push({ text: s.slice(last, m.index), italic: false });
    parts.push({ text: m[1], italic: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ text: s.slice(last), italic: false });
  return parts;
}

/** The source without its markers, for search and plain text. */
export function citePlain(s: string | null | undefined): string {
  return citeParts(s).map((p) => p.text).join("");
}
