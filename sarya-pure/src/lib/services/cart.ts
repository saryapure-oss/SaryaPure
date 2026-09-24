import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { getCurrentUser } from "@/lib/auth/session";
import { calculatePricing, type PricingResult } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { quoteShipping, type ShippingQuote } from "./shipping";
import { lookupCoupon } from "./coupons";

export const CART_COOKIE = "sp_cart";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              categoryId: true,
              taxRate: true,
              isPublished: true,
              images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  },
};

async function findCart() {
  const user = await getCurrentUser();
  if (user) return db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  return db.cart.findUnique({ where: { guestToken: sha256(token) }, include: cartInclude });
}

/** Only callable from Server Actions / Route Handlers (may set a cookie). */
export async function getOrCreateCartId(): Promise<string> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await db.cart.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id }, select: { id: true } });
    return cart.id;
  }
  const jar = await cookies();
  let token = jar.get(CART_COOKIE)?.value;
  if (token && token.length <= 100) {
    const existing = await db.cart.findUnique({ where: { guestToken: sha256(token) }, select: { id: true } });
    if (existing) return existing.id;
  }
  token = randomToken(24);
  const cart = await db.cart.create({ data: { guestToken: sha256(token) }, select: { id: true } });
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return cart.id;
}

/** Merge the guest cart into the user's cart after login/registration. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;
  if (!token) return;
  const guest = await db.cart.findUnique({ where: { guestToken: sha256(token) }, include: { items: true } });
  jar.delete(CART_COOKIE);
  if (!guest) return;
  const userCart = await db.cart.upsert({ where: { userId }, update: {}, create: { userId }, select: { id: true } });
  await db.$transaction(async (tx) => {
    for (const item of guest.items) {
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        update: { quantity: { increment: item.quantity } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
      });
    }
    if (guest.couponCode) await tx.cart.update({ where: { id: userCart.id }, data: { couponCode: guest.couponCode } });
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

export async function getCartCount(): Promise<number> {
  const cart = await findCart();
  return cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

export type CartLineView = {
  itemId: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string;
  image: string | null;
  imageAlt: string;
  unitPrice: number;
  mrp: number;
  quantity: number;
  available: number;
  lineSubtotal: number;
  problem: string | null;
};

export type CartView = {
  id: string | null;
  lines: CartLineView[];
  couponCode: string | null;
  pricing: PricingResult;
  shipping: ShippingQuote;
  hasProblems: boolean;
  itemCount: number;
};

/**
 * Build the authoritative cart view: current prices, stock and coupon validity straight from the DB.
 */
export async function getCartView(opts: { pincode?: string | null; paymentMethod?: "RAZORPAY" | "COD" } = {}): Promise<CartView> {
  const [cart, settings, user] = await Promise.all([findCart(), getSettings(), getCurrentUser()]);
  const commerce = settings.commerce;
  const shipping = await quoteShipping(opts.pincode, commerce);

  const lines: CartLineView[] = (cart?.items ?? []).map((item) => {
    const v = item.variant;
    const available = v.inventory ? Math.max(0, v.inventory.stock - v.inventory.reserved) : 0;
    let problem: string | null = null;
    if (!v.isActive || !v.product.isPublished) problem = "This item is no longer available.";
    else if (available <= 0) problem = "Out of stock.";
    else if (item.quantity > available) problem = `Only ${available} left in stock.`;
    return {
      itemId: item.id,
      variantId: v.id,
      productId: v.product.id,
      productName: v.product.name,
      productSlug: v.product.slug,
      variantName: v.name,
      sku: v.sku,
      image: v.product.images[0]?.url ?? null,
      imageAlt: v.product.images[0]?.alt ?? v.product.name,
      unitPrice: v.price,
      mrp: v.mrp,
      quantity: item.quantity,
      available,
      lineSubtotal: v.price * item.quantity,
      problem,
    };
  });

  const pricingLines = (cart?.items ?? [])
    .filter((_, i) => !lines[i]!.problem)
    .map((item) => ({
      variantId: item.variant.id,
      productId: item.variant.product.id,
      categoryId: item.variant.product.categoryId,
      unitPrice: item.variant.price,
      quantity: item.quantity,
      taxRate: Number(item.variant.product.taxRate),
    }));

  let couponError: string | null = null;
  let coupon = null;
  if (cart?.couponCode) {
    const res = await lookupCoupon(cart.couponCode, { userId: user?.id, email: user?.email });
    if (res.ok) coupon = res.coupon;
    else couponError = res.error;
  }

  const codFee = opts.paymentMethod === "COD" ? commerce.codFee : 0;
  const pricing = calculatePricing({
    lines: pricingLines,
    coupon,
    shipping: { rate: shipping.rate, freeAbove: shipping.freeAbove, serviceable: shipping.serviceable },
    codFee,
    pricesIncludeTax: commerce.pricesIncludeTax,
  });
  if (couponError) pricing.couponError = couponError;

  return {
    id: cart?.id ?? null,
    lines,
    couponCode: cart?.couponCode ?? null,
    pricing,
    shipping,
    hasProblems: lines.some((l) => l.problem),
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}
