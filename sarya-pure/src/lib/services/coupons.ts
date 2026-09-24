import "server-only";
import { db, type Tx } from "@/lib/db";
import type { PricingCoupon } from "@/lib/pricing";

export type CouponLookup = { ok: true; coupon: PricingCoupon & { id: string } } | { ok: false; error: string };

/**
 * Validates coupon state (active, dates, global & per-user limits). Amount rules (minimum order,
 * applicability) are enforced by the pricing engine.
 */
export async function lookupCoupon(
  code: string,
  who: { userId?: string | null; email?: string | null },
  client: Tx | typeof db = db,
): Promise<CouponLookup> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,30}$/.test(normalized)) return { ok: false, error: "Invalid coupon code." };
  const c = await client.coupon.findUnique({
    where: { code: normalized },
    include: { products: { select: { id: true } }, categories: { select: { id: true } } },
  });
  const now = new Date();
  if (!c || !c.isActive) return { ok: false, error: "This coupon code is not valid." };
  if (c.startsAt && c.startsAt > now) return { ok: false, error: "This coupon is not active yet." };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, error: "This coupon has expired." };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, error: "This coupon has reached its usage limit." };
  if (c.perUserLimit != null) {
    const or = [
      ...(who.userId ? [{ userId: who.userId }] : []),
      ...(who.email ? [{ email: who.email.toLowerCase() }] : []),
    ];
    if (or.length) {
      const used = await client.couponUsage.count({ where: { couponId: c.id, OR: or } });
      if (used >= c.perUserLimit) return { ok: false, error: "You have already used this coupon the maximum number of times." };
    }
  }
  return {
    ok: true,
    coupon: {
      id: c.id,
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount,
      scope: c.scope,
      productIds: c.products.map((p) => p.id),
      categoryIds: c.categories.map((x) => x.id),
    },
  };
}
