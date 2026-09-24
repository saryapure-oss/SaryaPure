"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { couponCode, optionalText, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { audit } from "@/lib/services/audit";

const coupon = z.object({
  code: couponCode,
  description: optionalText(300),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().int().min(1),
  minOrderAmount: z.coerce.number().int().min(0).default(0),
  maxDiscount: z.coerce.number().int().min(0).optional(),
  scope: z.enum(["ALL", "PRODUCTS", "CATEGORIES"]).default("ALL"),
  productIds: z.union([z.string(), z.array(z.string())]).optional(),
  categoryIds: z.union([z.string(), z.array(z.string())]).optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.coerce.number().int().min(1).optional(),
  perUserLimit: z.coerce.number().int().min(1).optional(),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
});

function toIds(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function baseFields(parsed: z.infer<typeof coupon>) {
  return {
    code: parsed.code,
    description: parsed.description,
    type: parsed.type,
    value: parsed.value,
    minOrderAmount: parsed.minOrderAmount,
    maxDiscount: parsed.maxDiscount ?? null,
    scope: parsed.scope,
    startsAt: parsed.startsAt ? new Date(parsed.startsAt) : null,
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    usageLimit: parsed.usageLimit ?? null,
    perUserLimit: parsed.perUserLimit ?? null,
    isActive: parsed.isActive === "on",
  };
}

function buildCreateData(parsed: z.infer<typeof coupon>) {
  return {
    ...baseFields(parsed),
    products: parsed.scope === "PRODUCTS" ? { connect: toIds(parsed.productIds).map((id) => ({ id })) } : undefined,
    categories: parsed.scope === "CATEGORIES" ? { connect: toIds(parsed.categoryIds).map((id) => ({ id })) } : undefined,
  };
}

function buildUpdateData(parsed: z.infer<typeof coupon>) {
  return {
    ...baseFields(parsed),
    products: { set: parsed.scope === "PRODUCTS" ? toIds(parsed.productIds).map((id) => ({ id })) : [] },
    categories: { set: parsed.scope === "CATEGORIES" ? toIds(parsed.categoryIds).map((id) => ({ id })) : [] },
  };
}

export async function createCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("coupons:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = coupon.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (parsed.data.type === "PERCENTAGE" && parsed.data.value > 100) return { ok: false, message: "Percentage discount cannot exceed 100.", fieldErrors: { value: "Max 100" } };

  const taken = await db.coupon.findUnique({ where: { code: parsed.data.code } });
  if (taken) return { ok: false, message: "This coupon code already exists.", fieldErrors: { code: "Already in use" } };

  const created = await db.coupon.create({ data: buildCreateData(parsed.data) });
  await audit({ actorId: admin.id, action: "coupon.create", entity: "Coupon", entityId: created.id, after: { code: created.code } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon created.", data: { id: created.id } };
}

export async function updateCoupon(couponId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("coupons:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = coupon.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (parsed.data.type === "PERCENTAGE" && parsed.data.value > 100) return { ok: false, message: "Percentage discount cannot exceed 100.", fieldErrors: { value: "Max 100" } };

  const existing = await db.coupon.findUnique({ where: { id: couponId } });
  if (!existing) return { ok: false, message: "Coupon not found." };
  const taken = await db.coupon.findFirst({ where: { code: parsed.data.code, NOT: { id: couponId } } });
  if (taken) return { ok: false, message: "This coupon code already exists.", fieldErrors: { code: "Already in use" } };

  await db.coupon.update({ where: { id: couponId }, data: buildUpdateData(parsed.data) });
  await audit({ actorId: admin.id, action: "coupon.update", entity: "Coupon", entityId: couponId, after: { code: parsed.data.code } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon saved." };
}

export async function toggleCouponActive(couponId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("coupons:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const c = await db.coupon.findUnique({ where: { id: couponId } });
  if (!c) return { ok: false, message: "Coupon not found." };
  await db.coupon.update({ where: { id: couponId }, data: { isActive: !c.isActive } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: c.isActive ? "Deactivated." : "Activated." };
}

export async function deleteCoupon(couponId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("coupons:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const used = await db.couponUsage.count({ where: { couponId } });
  if (used > 0) {
    await db.coupon.update({ where: { id: couponId }, data: { isActive: false } });
    return { ok: false, message: "This coupon has been used on orders and cannot be deleted — it has been deactivated instead." };
  }
  const c = await db.coupon.delete({ where: { id: couponId } }).catch(() => null);
  if (!c) return { ok: false, message: "Coupon not found." };
  await audit({ actorId: admin.id, action: "coupon.delete", entity: "Coupon", entityId: couponId, before: { code: c.code } });
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted." };
}
