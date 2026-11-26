/** Proxies a YouTube thumbnail so readers' browsers don't contact Google. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return new Response("Not found", { status: 404 });
  for (const size of ["maxresdefault", "hqdefault"]) {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/${size}.jpg`, { next: { revalidate: 86400 } }).catch(() => null);
    if (res?.ok) {
      return new Response(await res.arrayBuffer(), {
        headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=604800" },
      });
    }
  }
  return new Response("Not found", { status: 404 });
}
