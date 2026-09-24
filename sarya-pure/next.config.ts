import type { NextConfig } from "next";

/**
 * next/image requires every remote image host to be explicitly allow-listed. Product/category/CMS
 * images can be served from Cloudinary or an S3-compatible bucket/CDN depending on STORAGE_DRIVER
 * (see src/lib/services/storage.ts) — without these patterns, next/image throws at request time for
 * any image whose URL isn't same-origin, breaking product photos in production the moment a real
 * storage provider is configured.
 */
function remotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    patterns.push({ protocol: "https", hostname: "res.cloudinary.com", pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/**` });
  }

  if (process.env.S3_PUBLIC_URL) {
    try {
      const url = new URL(process.env.S3_PUBLIC_URL);
      patterns.push({ protocol: url.protocol.replace(":", "") as "http" | "https", hostname: url.hostname, port: url.port || undefined, pathname: "/**" });
    } catch {
      // Malformed S3_PUBLIC_URL — ignored here; storage.ts already refuses to upload without a valid one.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: remotePatterns(),
  },
};

export default nextConfig;
