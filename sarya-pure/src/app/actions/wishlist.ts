"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { id } from "@/lib/validation/common";
import { getCurrentUser } from "@/lib/auth/session";
import { track } from "@/lib/services/analytics";
import { addToCart, type CartActionResult } from "./cart";

export async function toggleWishlist(productId: string): Promise<CartActionResult & { inWishlist?: boolean; requiresLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresLogin: true, message: "Please sign in to save items to your wishlist." };
  if (!id.safeParse(productId).success) return { ok: false, message: "Invalid product." };
  const product = await db.product.findFirst({ where: { id: productId, isPublished: true }, select: { id: true } });
  if (!product) return { ok: false, message: "Product not found." };
  const wl = await db.wishlist.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } });
  const existing = await db.wishlistItem.findUnique({ where: { wishlistId_productId: { wishlistId: wl.id, productId } } });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    await track("wishlist_remove", { productId });
  } else {
    await db.wishlistItem.create({ data: { wishlistId: wl.id, productId } });
    await track("wishlist_add", { productId });
  }
  revalidatePath("/wishlist");
  return { ok: true, inWishlist: !existing, message: existing ? "Removed from wishlist." : "Saved to wishlist." };
}

export async function removeFromWishlist(productId: string): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user || !id.safeParse(productId).success) return { ok: false, message: "Not allowed." };
  await db.wishlistItem.deleteMany({ where: { productId, wishlist: { userId: user.id } } });
  revalidatePath("/wishlist");
  return { ok: true, message: "Removed from wishlist." };
}

export async function moveWishlistToCart(productId: string): Promise<CartActionResult> {
  const user = await getCurrentUser();
  if (!user || !id.safeParse(productId).success) return { ok: false, message: "Not allowed." };
  const variant = await db.productVariant.findFirst({
    where: { productId, isActive: true, inventory: { stock: { gt: 0 } } },
    orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
  });
  if (!variant) return { ok: false, message: "This item is currently out of stock." };
  const res = await addToCart({ variantId: variant.id, quantity: 1 });
  if (res.ok) await db.wishlistItem.deleteMany({ where: { productId, wishlist: { userId: user.id } } });
  revalidatePath("/wishlist");
  return res;
}
