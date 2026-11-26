import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db, schema } from "@/db";
import { putObject } from "@/lib/storage";
import { mediaUrl } from "@/lib/urls";

/** Web sizes made for every upload (px wide). Never larger than the original. */
const WIDTHS = [640, 1280, 2100];
const MAX_BYTES = 25 * 1024 * 1024;

export async function saveUpload(file: File, alt?: string) {
  if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name))
    throw new Error("This is an iPhone HEIC photo. Please save it as a JPEG first (in Photos: File → Export), then upload it.");
  if (!file.type.startsWith("image/")) throw new Error("Only images can be uploaded.");
  if (file.size > MAX_BYTES) throw new Error("That image is over 25 MB. Please use a smaller one.");
  const input = Buffer.from(await file.arrayBuffer());
  // Turn the photo upright using its camera data, then drop location and camera info.
  const base = sharp(input, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const id = randomUUID();
  const folder = `images/${new Date().toISOString().slice(0, 7)}/${id}`;

  // "Original" is a high-quality copy capped at 3000px, without metadata.
  const original = await base.clone().resize({ width: 3000, withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const originalKey = `${folder}/original.jpg`;
  await putObject(originalKey, original, "image/jpeg");

  const variants: { width: number; storageKey: string; format: string }[] = [];
  for (const w of WIDTHS) {
    const target = Math.min(w, width || w);
    if (variants.some((v) => v.width === target)) break;
    const buf = await base.clone().resize({ width: target, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const key = `${folder}/${target}.webp`;
    await putObject(key, buf, "image/webp");
    variants.push({ width: target, storageKey: key, format: "webp" });
  }

  const [row] = await db
    .insert(schema.media)
    .values({
      storageKey: originalKey,
      originalName: file.name.slice(0, 200),
      mimeType: "image/jpeg",
      width,
      height,
      bytes: original.length,
      alt: alt ?? null,
      variants,
    })
    .returning();
  const largest = variants.at(-1)!;
  return { id: row.id, src: mediaUrl(largest.storageKey), width, height };
}
