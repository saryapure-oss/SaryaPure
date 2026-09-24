import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const ANALYTICS_EVENTS = [
  "product_view",
  "search",
  "add_to_cart",
  "remove_from_cart",
  "wishlist_add",
  "wishlist_remove",
  "checkout_started",
  "payment_started",
  "purchase",
  "coupon_applied",
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[number];

export const ANON_COOKIE = "sp_anon";

/**
 * First-party, privacy-friendly event tracking. Stores an anonymous random id — no names, emails or IPs.
 * Swap/extend this function to forward events to GA4, PostHog, etc.
 */
export async function track(type: AnalyticsEventType, data: { productId?: string | null; meta?: Record<string, string | number | boolean | null> } = {}) {
  try {
    let anonId: string | null = null;
    try {
      anonId = (await cookies()).get(ANON_COOKIE)?.value?.slice(0, 64) ?? null;
    } catch {
      anonId = null;
    }
    await db.analyticsEvent.create({
      data: { type, anonId, productId: data.productId ?? null, meta: (data.meta ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  } catch (e) {
    console.error("[analytics] failed", e);
  }
}
