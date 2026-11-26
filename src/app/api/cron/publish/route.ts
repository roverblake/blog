import { revalidatePath } from "next/cache";
import { publishDuePosts } from "@/lib/post-service";

/**
 * Called every few minutes by the Railway cron service (scripts/cron-publish.mjs).
 * Requires the CRON_SECRET so nobody else can trigger it.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const published = await publishDuePosts();
  if (published) revalidatePath("/", "layout");
  return Response.json({ published });
}

export const POST = handle;
export const GET = handle;
