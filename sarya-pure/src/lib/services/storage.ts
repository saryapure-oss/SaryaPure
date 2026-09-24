import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { randomToken } from "@/lib/security/crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
} as const;
type AllowedMime = keyof typeof ALLOWED;

export class UploadError extends Error {}

/** Detect real type from magic bytes — never trust the browser-provided MIME or extension alone. */
function sniff(buf: Buffer): AllowedMime | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /avi[fs]/.test(buf.toString("ascii", 8, 12))) return "image/avif";
  return null;
}

export async function validateImage(file: File): Promise<Buffer> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) throw new UploadError("Please choose an image file.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Image must be 5 MB or smaller.");
  const declared = file.type as AllowedMime;
  if (!(declared in ALLOWED)) throw new UploadError("Only JPG, PNG, WebP or AVIF images are allowed.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED[declared] as readonly string[]).includes(ext)) throw new UploadError("File extension does not match the image type.");
  const buf = Buffer.from(await file.arrayBuffer());
  const real = sniff(buf);
  if (!real || real !== declared) throw new UploadError("The file content is not a valid image.");
  return buf;
}

/** Re-encode to WebP (strips metadata/EXIF and any embedded payloads), cap dimensions. */
async function optimise(buf: Buffer): Promise<Buffer> {
  return sharp(buf, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

function driver(): "local" | "cloudinary" | "s3" {
  const d = process.env.STORAGE_DRIVER ?? "local";
  return d === "cloudinary" || d === "s3" ? d : "local";
}

async function uploadLocal(buf: Buffer, folder: string, name: string): Promise<string> {
  if (process.env.VERCEL) throw new UploadError("Local storage is not available on Vercel. Configure Cloudinary or S3.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${folder}/${name}`;
}

async function uploadCloudinary(buf: Buffer, folder: string, name: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new UploadError("Cloudinary is not configured.");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const fullFolder = `${process.env.CLOUDINARY_FOLDER ?? "sarya-pure"}/${folder}`;
  const publicId = name.replace(/\.webp$/, "");
  const toSign = `folder=${fullFolder}&public_id=${publicId}&timestamp=${timestamp}${secret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: "image/webp" }), name);
  form.append("api_key", key);
  form.append("timestamp", timestamp);
  form.append("folder", fullFolder);
  form.append("public_id", publicId);
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !json.secure_url) throw new UploadError(`Upload failed: ${json.error?.message ?? res.status}`);
  return json.secure_url;
}

let s3: S3Client | null = null;
async function uploadS3(buf: Buffer, folder: string, name: string): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  const publicUrl = process.env.S3_PUBLIC_URL;
  if (!bucket || !publicUrl) throw new UploadError("S3 storage is not configured.");
  s3 ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
  });
  const key = `${folder}/${name}`;
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/** Validate + optimise + store an image. Returns its public URL. */
export async function storeImage(file: File, folder: "products" | "categories" | "reviews" | "cms" | "brand"): Promise<string> {
  const raw = await validateImage(file);
  const buf = await optimise(raw);
  const name = `${Date.now()}-${randomToken(6)}.webp`;
  switch (driver()) {
    case "cloudinary":
      return uploadCloudinary(buf, folder, name);
    case "s3":
      return uploadS3(buf, folder, name);
    default:
      return uploadLocal(buf, folder, name);
  }
}
