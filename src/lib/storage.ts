import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

/**
 * Image storage. Uses the Railway bucket (S3-compatible) when S3_BUCKET is
 * set; otherwise a local folder (MEDIA_DIR, default ./.media), which also
 * works with a Railway volume mounted at that path.
 */
const bucket = process.env.S3_BUCKET;
const localDir = path.resolve(process.env.MEDIA_DIR ?? ".media");

let client: S3Client | null = null;
function s3() {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "auto",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return client;
}

function safeKey(key: string) {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) throw new Error("Bad storage key");
  return key;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  safeKey(key);
  if (bucket) {
    await s3().send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }),
    );
    return;
  }
  const file = path.join(localDir, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body);
}

export async function getObject(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  safeKey(key);
  try {
    if (bucket) {
      const res = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await res.Body!.transformToByteArray();
      return { body: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
    }
    const body = await readFile(path.join(localDir, key));
    const ext = path.extname(key).slice(1);
    const contentType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
    return { body, contentType };
  } catch {
    return null;
  }
}
