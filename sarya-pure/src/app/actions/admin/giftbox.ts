"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { audit } from "@/lib/services/audit";
import { formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";

const GIFT_BOX_TYPES = ["CORPORATE", "FESTIVAL", "WEDDING", "PREMIUM", "CUSTOM"] as const;

async function revalidateProduct(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidatePath(`/admin/products/${productId}`);
  if (product) revalidatePath(`/products/${product.slug}`);
  revalidatePath("/gift-hampers");
}

export async function createGiftBox(productId: string, type: (typeof GIFT_BOX_TYPES)[number]): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const existing = await db.giftBox.findUnique({ where: { productId } });
  if (existing) return { ok: false, message: "This product is already a gift box." };
  await db.giftBox.create({ data: { productId, type } });
  await audit({ actorId: admin.id, action: "giftbox.create", entity: "Product", entityId: productId, after: { type } });
  await revalidateProduct(productId);
  return { ok: true, message: "This product is now a gift box. Add its contents below." };
}

export async function deleteGiftBox(productId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const existing = await db.giftBox.findUnique({ where: { productId } });
  if (!existing) return { ok: false, message: "This product is not a gift box." };
  await db.giftBox.delete({ where: { productId } }); // cascades to GiftBoxItem
  await audit({ actorId: admin.id, action: "giftbox.delete", entity: "Product", entityId: productId });
  await revalidateProduct(productId);
  return { ok: true, message: "Gift box removed. This is now a regular product." };
}

export async function updateGiftBox(giftBoxId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const schema = z.object({ type: z.enum(GIFT_BOX_TYPES), allowGiftMessage: z.union([z.literal("on"), z.literal("")]).optional() });
  const parsed = schema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const box = await db.giftBox.update({ where: { id: giftBoxId }, data: { type: parsed.data.type, allowGiftMessage: parsed.data.allowGiftMessage === "on" } });
  await audit({ actorId: admin.id, action: "giftbox.update", entity: "Product", entityId: box.productId, after: parsed.data });
  await revalidateProduct(box.productId);
  return { ok: true, message: "Gift box updated." };
}

const addItemSchema = z.object({
  sku: z.string().trim().min(1).max(40).toUpperCase(),
  quantity: z.coerce.number().int().min(1).max(20),
});

export async function addGiftBoxItem(giftBoxId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = addItemSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const box = await db.giftBox.findUnique({ where: { id: giftBoxId } });
  if (!box) return { ok: false, message: "Gift box not found." };

  const variant = await db.productVariant.findUnique({ where: { sku: parsed.data.sku }, select: { id: true, productId: true, name: true, isActive: true } });
  if (!variant) return { ok: false, message: `No variant found with SKU "${parsed.data.sku}". Check the SKU on that product's page.` };
  if (variant.productId === box.productId) return { ok: false, message: "A gift box can't contain its own variant." };
  if (!variant.isActive) return { ok: false, message: "That variant is inactive — activate it first, or choose another." };

  await db.giftBoxItem.upsert({
    where: { giftBoxId_variantId: { giftBoxId, variantId: variant.id } },
    update: { quantity: { increment: parsed.data.quantity } },
    create: { giftBoxId, variantId: variant.id, quantity: parsed.data.quantity },
  });
  await audit({ actorId: admin.id, action: "giftbox.item_add", entity: "Product", entityId: box.productId, after: { sku: parsed.data.sku, quantity: parsed.data.quantity } });
  await revalidateProduct(box.productId);
  return { ok: true, message: `Added ${variant.name}.` };
}

export async function removeGiftBoxItem(itemId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const item = await db.giftBoxItem.findUnique({ where: { id: itemId }, include: { giftBox: true } });
  if (!item) return { ok: false, message: "Item not found." };
  await db.giftBoxItem.delete({ where: { id: itemId } });
  await audit({ actorId: admin.id, action: "giftbox.item_remove", entity: "Product", entityId: item.giftBox.productId });
  await revalidateProduct(item.giftBox.productId);
  return { ok: true, message: "Removed." };
}
