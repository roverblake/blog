import { randomUUID } from "node:crypto";
import { isAdmin } from "@/lib/session";
import { putObject } from "@/lib/storage";

const TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};
const MAX = 150 * 1024 * 1024;

/** Admin-only audio upload (sermon recordings, readings). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Please sign in again." }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file received." }, { status: 400 });
  const ext = TYPES[file.type] ?? (/\.(mp3|m4a|aac|ogg|wav)$/i.exec(file.name)?.[1].toLowerCase() ?? null);
  if (!ext) return Response.json({ error: "Please choose an MP3, M4A, OGG or WAV file." }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "That file is over 150 MB. Try exporting it as an MP3." }, { status: 400 });
  const key = `audio/${randomUUID()}.${ext}`;
  const contentType = ext === "mp3" ? "audio/mpeg" : ext === "m4a" ? "audio/mp4" : `audio/${ext}`;
  await putObject(key, Buffer.from(await file.arrayBuffer()), contentType);
  return Response.json({ src: `/media/${key}`, title: file.name.replace(/\.[^.]+$/, "") });
}
