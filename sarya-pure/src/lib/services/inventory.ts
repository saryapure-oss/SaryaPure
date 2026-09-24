import "server-only";
import { db, type Tx } from "@/lib/db";

export class OutOfStockError extends Error {
  constructor(public variantId: string, message = "Some items in your cart are no longer available in the requested quantity.") {
    super(message);
  }
}

/** Atomically hold stock for a pending order. Fails if available (stock - reserved) is insufficient. */
export async function reserveStock(tx: Tx, variantId: string, qty: number) {
  const n = await tx.$executeRaw`
    UPDATE "Inventory" SET "reserved" = "reserved" + ${qty}, "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND "stock" - "reserved" >= ${qty}`;
  if (n !== 1) throw new OutOfStockError(variantId);
}

/** Convert a reservation into a real deduction (order paid / COD confirmed). */
export async function commitReservedStock(tx: Tx, variantId: string, qty: number) {
  const n = await tx.$executeRaw`
    UPDATE "Inventory" SET "stock" = "stock" - ${qty}, "reserved" = GREATEST("reserved" - ${qty}, 0), "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND "stock" >= ${qty}`;
  if (n !== 1) throw new OutOfStockError(variantId);
}

/** Deduct stock directly (used when a reservation had already been released). */
export async function deductStock(tx: Tx, variantId: string, qty: number) {
  const n = await tx.$executeRaw`
    UPDATE "Inventory" SET "stock" = "stock" - ${qty}, "updatedAt" = NOW()
    WHERE "variantId" = ${variantId} AND "stock" - "reserved" >= ${qty}`;
  if (n !== 1) throw new OutOfStockError(variantId);
}

export async function releaseReservedStock(tx: Tx, variantId: string, qty: number) {
  await tx.$executeRaw`
    UPDATE "Inventory" SET "reserved" = GREATEST("reserved" - ${qty}, 0), "updatedAt" = NOW()
    WHERE "variantId" = ${variantId}`;
}

export async function restock(tx: Tx, variantId: string, qty: number) {
  await tx.$executeRaw`UPDATE "Inventory" SET "stock" = "stock" + ${qty}, "updatedAt" = NOW() WHERE "variantId" = ${variantId}`;
}

/** Recompute denormalised product fields used for listing/filtering. */
export async function syncProductAggregates(productId: string, client: Tx | typeof db = db) {
  const variants = await client.productVariant.findMany({
    where: { productId, isActive: true },
    include: { inventory: true },
  });
  const prices = variants.map((v) => v.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxDiscountPct = variants.reduce((m, v) => (v.mrp > v.price ? Math.max(m, Math.round(((v.mrp - v.price) / v.mrp) * 100)) : m), 0);
  const inStock = variants.some((v) => (v.inventory ? v.inventory.stock - v.inventory.reserved > 0 : false));
  const rating = await client.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: true,
  });
  await client.product.update({
    where: { id: productId },
    data: {
      minPrice,
      maxDiscountPct,
      inStock,
      avgRating: Math.round((rating._avg.rating ?? 0) * 10) / 10,
      reviewCount: rating._count,
    },
  });
}

export async function syncProductsForVariants(variantIds: string[], client: Tx | typeof db = db) {
  const rows = await client.productVariant.findMany({ where: { id: { in: variantIds } }, select: { productId: true } });
  for (const pid of new Set(rows.map((r) => r.productId))) await syncProductAggregates(pid, client);
}
