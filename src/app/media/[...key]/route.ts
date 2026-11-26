import { getObject } from "@/lib/storage";

/** Serves stored images. Keys are unique per upload, so they cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const obj = await getObject(key.join("/")).catch(() => null);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.body), {
    headers: { "content-type": obj.contentType, "cache-control": "public, max-age=31536000, immutable" },
  });
}
