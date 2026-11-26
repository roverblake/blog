import { unsubscribeByToken } from "@/lib/subscriptions";

/** RFC 8058 one-click unsubscribe (used by Gmail and Apple Mail's built-in button). */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const list = url.searchParams.get("list") ?? "all";
  if (!/^(all|essays|parish)$/.test(list)) return new Response("Bad list", { status: 400 });
  const res = token ? await unsubscribeByToken(token, list) : null;
  return new Response(res ? "Unsubscribed" : "Not found", { status: res ? 200 : 404 });
}
