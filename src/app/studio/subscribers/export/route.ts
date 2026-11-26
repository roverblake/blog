import { subscribersCsv } from "@/lib/csv";
import { requireAdmin } from "@/lib/session";

export async function GET(req: Request) {
  await requireAdmin();
  const list = new URL(req.url).searchParams.get("list") ?? undefined;
  const csv = await subscribersCsv(list === "essays" || list === "parish" ? list : undefined);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="subscribers-${list ?? "all"}-${date}.csv"`,
    },
  });
}
