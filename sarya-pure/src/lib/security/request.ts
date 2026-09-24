import "server-only";
import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function getUserAgent(): Promise<string | null> {
  const h = await headers();
  return h.get("user-agent")?.slice(0, 300) ?? null;
}

/**
 * CSRF defence for route handlers that mutate state (Server Actions already verify Origin).
 * Rejects cross-site requests whose Origin/Referer host differs from the Host header.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
