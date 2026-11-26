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
    const types: Record<string, string> = {
      webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
      mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav",
    };
    const contentType = types[ext] ?? "application/octet-stream";
    return { body, contentType };
  } catch {
    return null;
  }
}

/**
 * Whether uploads will survive a redeploy. On Railway, files are only kept in
 * a bucket or on a volume; the app's own disk is wiped on every update.
 * Returns a plain-language warning for the Studio, or null when all is well.
 */
export async function storageWarning(): Promise<string | null> {
  if (bucket) return null;
  const onRailway = !!process.env.RAILWAY_ENVIRONMENT_NAME || !!process.env.RAILWAY_PROJECT_ID;
  if (!onRailway) return null;
  if (!process.env.MEDIA_DIR) {
    return "Images and audio are not saved permanently yet: they are erased whenever the site updates. Add a Railway volume and set MEDIA_DIR (see docs/launch-checklist.md).";
  }
  try {
    const { stat, unlink } = await import("node:fs/promises");
    await mkdir(localDir, { recursive: true });
    const probe = path.join(localDir, ".write-test");
    await writeFile(probe, "ok");
    await unlink(probe);
    // A volume is a separate disk; if MEDIA_DIR sits on the app's own disk, it isn't one.
    const [dir, root] = await Promise.all([stat(localDir), stat("/")]);
    if (dir.dev === root.dev) {
      return `MEDIA_DIR is set to ${localDir}, but no Railway volume is attached there, so uploads are still erased on each update. Attach a volume with mount path ${path.dirname(localDir) === "/" ? localDir : path.dirname(localDir)}.`;
    }
    return null;
  } catch {
    return `Uploads can't be saved to ${localDir}. Check the volume's mount path in Railway.`;
  }
}
