import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by PostgreSQL so it works across serverless instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 0) <= limit;
}

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests. Please wait a moment and try again.");
  }
}

export async function assertRateLimit(key: string, limit: number, windowSeconds: number) {
  if (!(await rateLimit(key, limit, windowSeconds))) throw new RateLimitError();
}
