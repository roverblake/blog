import { getObject } from "@/lib/storage";

/**
 * Serves stored images and audio. Keys are unique per upload, so they cache
 * forever. Supports byte ranges so audio players can skip ahead.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const obj = await getObject(key.join("/")).catch(() => null);
  if (!obj) return new Response("Not found", { status: 404 });
  const size = obj.body.length;
  const base = { "content-type": obj.contentType, "cache-control": "public, max-age=31536000, immutable", "accept-ranges": "bytes" };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(new Uint8Array(obj.body.subarray(start, end + 1)), {
      status: 206,
      headers: { ...base, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(obj.body), { headers: { ...base, "content-length": String(size) } });
}
