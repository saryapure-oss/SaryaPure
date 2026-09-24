"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { couponCode, id, quantity, type ActionState } from "@/lib/validation/common";
import { getOrCreateCartId, getCartView, getCartCount } from "@/lib/services/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { lookupCoupon } from "@/lib/services/coupons";
import { track } from "@/lib/services/analytics";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";

export type CartActionResult = { ok: boolean; message: string; count?: number };

async function ownedItem(itemId: string) {
  const cartId = await getOrCreateCartId();
  const item = await db.cartItem.findFirst({ where: { id: itemId, cartId }, include: { variant: { include: { inventory: true } } } });
  return { cartId, item };
}

function availableOf(inv: { stock: number; reserved: number } | null) {
  return inv ? Math.max(0, inv.stock - inv.reserved) : 0;
}

export async function addToCart(input: { variantId: string; quantity: number }): Promise<CartActionResult> {
  const parsed = z.object({ variantId: id, quantity }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid product or quantity." };
  if (!(await rateLimit(`cart:${await getClientIp()}`, 60, 60))) return { ok: false, message: "Too many requests. Please slow down." };
  const { variantId, quantity: qty } = parsed.data;
  const { commerce } = await getSettings();

  const variant = await db.productVariant.findFirst({
    where: { id: variantId, isActive: true, product: { isPublished: true } },
    include: { inventory: true, product: { select: { id: true, name: true } } },
  });
  if (!variant) return { ok: false, message: "This product is not available." };
  const available = availableOf(variant.inventory);
  if (available <= 0) return { ok: false, message: "Sorry, this item is out of stock." };

  const cartId = await getOrCreateCartId();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const desired = (existing?.quantity ?? 0) + qty;
  const max = Math.min(available, commerce.maxQtyPerItem);
  if (desired > max) {
    if ((existing?.quantity ?? 0) >= max) return { ok: false, message: `You already have the maximum available quantity (${max}) in your cart.` };
  }
  const finalQty = Math.min(desired, max);
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    update: { quantity: finalQty },
    create: { cartId, variantId, quantity: finalQty },
  });
  await track("add_to_cart", { productId: variant.product.id, meta: { variantId, qty } });
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: finalQty < desired ? `Only ${max} available — quantity adjusted.` : `${variant.product.name} (${variant.name}) added to cart.`,
    count: await getCartCount(),
  };
}

export async function buyNow(input: { variantId: string; quantity: number }): Promise<CartActionResult> {
  const res = await addToCart(input);
  if (!res.ok) return res;
  redirect("/checkout");
}

export async function updateCartItem(input: { itemId: string; quantity: number }): Promise<CartActionResult> {
  const parsed = z.object({ itemId: id, quantity: z.coerce.number().int().min(0).max(50) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid quantity." };
  const { item } = await ownedItem(parsed.data.itemId);
  if (!item) return { ok: false, message: "Item not found in your cart." };
  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    await track("remove_from_cart", { meta: { variantId: item.variantId } });
  } else {
    const { commerce } = await getSettings();
    const max = Math.min(availableOf(item.variant.inventory), commerce.maxQtyPerItem);
    if (parsed.data.quantity > max) return { ok: false, message: max > 0 ? `Only ${max} available.` : "This item is out of stock." };
    await db.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Cart updated." };
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  return updateCartItem({ itemId, quantity: 0 });
}

export async function moveCartItemToWishlist(itemId: string): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to use your wishlist." };
  if (!id.safeParse(itemId).success) return { ok: false, message: "Invalid item." };
  const { item } = await ownedItem(itemId);
  if (!item) return { ok: false, message: "Item not found." };
  const wl = await db.wishlist.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  await db.$transaction([
    db.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wl.id, productId: item.variant.productId } },
      update: {},
      create: { wishlistId: wl.id, productId: item.variant.productId },
    }),
    db.cartItem.delete({ where: { id: item.id } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Moved to wishlist." };
}

export async function applyCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = couponCode.safeParse(fd.get("code") ?? "");
  if (!parsed.success) return { ok: false, message: "Enter a valid coupon code." };
  if (!(await rateLimit(`coupon:${await getClientIp()}`, 15, 300))) return { ok: false, message: "Too many attempts. Please try later." };
  const user = await getCurrentUser();
  const res = await lookupCoupon(parsed.data, { userId: user?.id, email: user?.email });
  if (!res.ok) return { ok: false, message: res.error };
  const cartId = await getOrCreateCartId();
  await db.cart.update({ where: { id: cartId }, data: { couponCode: res.coupon.code } });
  const view = await getCartView();
  if (!view.pricing.couponApplied) {
    await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
    return { ok: false, message: view.pricing.couponError ?? "This coupon cannot be applied to your cart." };
  }
  await track("coupon_applied", { meta: { code: res.coupon.code, stage: "cart" } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true, message: `Coupon ${res.coupon.code} applied.` };
}

export async function removeCoupon(): Promise<CartActionResult> {
  const cartId = await getOrCreateCartId();
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { ok: true, message: "Coupon removed." };
}
