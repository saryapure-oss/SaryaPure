"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { id, slug, text, optionalText, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { syncProductAggregates } from "@/lib/services/inventory";
import { storeImage, UploadError } from "@/lib/services/storage";
import { audit } from "@/lib/services/audit";

const productSchema = z.object({
  name: text(150),
  slug,
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{2,40}$/, "SKU may contain letters, numbers, - and _"),
  categoryId: id,
  tags: optionalText(300),
  shortDescription: optionalText(300),
  description: optionalText(5000),
  ingredients: optionalText(2000),
  nutritionInfo: optionalText(2000),
  allergens: optionalText(500),
  storageInstructions: optionalText(500),
  shippingInfo: optionalText(500),
  taxRate: z.coerce.number().min(0).max(28),
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  isFeatured: z.union([z.literal("on"), z.literal("")]).optional(),
  isBestSeller: z.union([z.literal("on"), z.literal("")]).optional(),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});

function tagsToArray(v: string | null): string[] {
  return (v ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function createProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };

  const parsed = productSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const existingSlug = await db.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existingSlug) return { ok: false, message: "A product with this slug already exists.", fieldErrors: { slug: "Already in use" } };
  const existingSku = await db.product.findUnique({ where: { sku: parsed.data.sku } });
  if (existingSku) return { ok: false, message: "A product with this SKU already exists.", fieldErrors: { sku: "Already in use" } };

  const category = await db.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { ok: false, message: "Select a valid category.", fieldErrors: { categoryId: "Invalid category" } };

  const product = await db.product.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
      tags: tagsToArray(parsed.data.tags),
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      ingredients: parsed.data.ingredients,
      nutritionInfo: parsed.data.nutritionInfo,
      allergens: parsed.data.allergens,
      storageInstructions: parsed.data.storageInstructions,
      shippingInfo: parsed.data.shippingInfo,
      taxRate: parsed.data.taxRate,
      isPublished: parsed.data.isPublished === "on",
      isFeatured: parsed.data.isFeatured === "on",
      isBestSeller: parsed.data.isBestSeller === "on",
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });
  await audit({ actorId: admin.id, action: "product.create", entity: "Product", entityId: product.id, after: { name: product.name, slug: product.slug } });
  revalidatePath("/admin/products");
  return { ok: true, message: "Product created. Now add variants, inventory and images.", data: { id: product.id } };
}

export async function updateProduct(productId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = productSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) return { ok: false, message: "Product not found." };

  const slugTaken = await db.product.findFirst({ where: { slug: parsed.data.slug, NOT: { id: productId } } });
  if (slugTaken) return { ok: false, message: "Slug already in use by another product.", fieldErrors: { slug: "Already in use" } };
  const skuTaken = await db.product.findFirst({ where: { sku: parsed.data.sku, NOT: { id: productId } } });
  if (skuTaken) return { ok: false, message: "SKU already in use by another product.", fieldErrors: { sku: "Already in use" } };

  await db.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      sku: parsed.data.sku,
      categoryId: parsed.data.categoryId,
      tags: tagsToArray(parsed.data.tags),
      shortDescription: parsed.data.shortDescription,
      description: parsed.data.description,
      ingredients: parsed.data.ingredients,
      nutritionInfo: parsed.data.nutritionInfo,
      allergens: parsed.data.allergens,
      storageInstructions: parsed.data.storageInstructions,
      shippingInfo: parsed.data.shippingInfo,
      taxRate: parsed.data.taxRate,
      isPublished: parsed.data.isPublished === "on",
      isFeatured: parsed.data.isFeatured === "on",
      isBestSeller: parsed.data.isBestSeller === "on",
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });
  await audit({ actorId: admin.id, action: "product.update", entity: "Product", entityId: productId, before: { name: existing.name }, after: { name: parsed.data.name } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${parsed.data.slug}`);
  return { ok: true, message: "Product saved." };
}

export async function deleteProduct(productId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:delete").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const usedInOrders = await db.orderItem.count({ where: { productId } });
  if (usedInOrders > 0) {
    await db.product.update({ where: { id: productId }, data: { isPublished: false } });
    return { ok: false, message: "This product has order history and cannot be deleted — it has been unpublished instead." };
  }
  const product = await db.product.delete({ where: { id: productId } }).catch(() => null);
  if (!product) return { ok: false, message: "Product not found." };
  await audit({ actorId: admin.id, action: "product.delete", entity: "Product", entityId: productId, before: { name: product.name } });
  revalidatePath("/admin/products");
  return { ok: true, message: "Product deleted." };
}

export async function toggleProductPublish(productId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };
  await db.product.update({ where: { id: productId }, data: { isPublished: !product.isPublished } });
  await audit({ actorId: admin.id, action: "product.publish", entity: "Product", entityId: productId, after: { isPublished: !product.isPublished } });
  revalidatePath("/admin/products");
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: product.isPublished ? "Unpublished." : "Published." };
}

// ───────────────────────────── Variants ─────────────────────────────

const variantSchema = z.object({
  name: text(40),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{2,40}$/, "SKU may contain letters, numbers, - and _"),
  weightGrams: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().int("Enter a whole number of paise/rupees").min(1),
  mrp: z.coerce.number().int().min(1),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
  isDefault: z.union([z.literal("on"), z.literal("")]).optional(),
  initialStock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
});

export async function createVariant(productId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = variantSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (parsed.data.mrp < parsed.data.price) return { ok: false, message: "MRP cannot be less than the selling price.", fieldErrors: { mrp: "MRP must be ≥ price" } };

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };
  const skuTaken = await db.productVariant.findUnique({ where: { sku: parsed.data.sku } });
  if (skuTaken) return { ok: false, message: "Variant SKU already in use.", fieldErrors: { sku: "Already in use" } };

  await db.$transaction(async (tx) => {
    if (parsed.data.isDefault === "on") await tx.productVariant.updateMany({ where: { productId }, data: { isDefault: false } });
    const variant = await tx.productVariant.create({
      data: {
        productId,
        sku: parsed.data.sku,
        name: parsed.data.name,
        weightGrams: parsed.data.weightGrams ?? null,
        price: parsed.data.price,
        mrp: parsed.data.mrp,
        isActive: parsed.data.isActive === "on",
        isDefault: parsed.data.isDefault === "on",
      },
    });
    await tx.inventory.create({ data: { variantId: variant.id, stock: parsed.data.initialStock, lowStockThreshold: parsed.data.lowStockThreshold } });
  });
  await syncProductAggregates(productId);
  await audit({ actorId: admin.id, action: "variant.create", entity: "Product", entityId: productId, after: { name: parsed.data.name } });
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Variant added." };
}

export async function updateVariant(variantId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = variantSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (parsed.data.mrp < parsed.data.price) return { ok: false, message: "MRP cannot be less than the selling price.", fieldErrors: { mrp: "MRP must be ≥ price" } };

  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false, message: "Variant not found." };
  const skuTaken = await db.productVariant.findFirst({ where: { sku: parsed.data.sku, NOT: { id: variantId } } });
  if (skuTaken) return { ok: false, message: "Variant SKU already in use.", fieldErrors: { sku: "Already in use" } };

  await db.$transaction(async (tx) => {
    if (parsed.data.isDefault === "on") await tx.productVariant.updateMany({ where: { productId: variant.productId, NOT: { id: variantId } }, data: { isDefault: false } });
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        sku: parsed.data.sku,
        name: parsed.data.name,
        weightGrams: parsed.data.weightGrams ?? null,
        price: parsed.data.price,
        mrp: parsed.data.mrp,
        isActive: parsed.data.isActive === "on",
        isDefault: parsed.data.isDefault === "on",
      },
    });
  });
  await syncProductAggregates(variant.productId);
  await audit({ actorId: admin.id, action: "variant.update", entity: "Product", entityId: variant.productId, after: { name: parsed.data.name } });
  revalidatePath(`/admin/products/${variant.productId}`);
  return { ok: true, message: "Variant saved." };
}

export async function deleteVariant(variantId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const variant = await db.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return { ok: false, message: "Variant not found." };
  const used = await db.orderItem.count({ where: { variantId } });
  if (used > 0) {
    await db.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
    await syncProductAggregates(variant.productId);
    return { ok: false, message: "This variant has order history and cannot be deleted — it has been deactivated instead." };
  }
  await db.productVariant.delete({ where: { id: variantId } });
  await syncProductAggregates(variant.productId);
  await audit({ actorId: admin.id, action: "variant.delete", entity: "Product", entityId: variant.productId });
  revalidatePath(`/admin/products/${variant.productId}`);
  return { ok: true, message: "Variant deleted." };
}

/** Sets stock to an exact value (distinct from the customer-facing atomic reserve/commit paths). */
export async function setInventory(variantId: string, stock: number, lowStockThreshold: number): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("inventory:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  if (!Number.isInteger(stock) || stock < 0) return { ok: false, message: "Stock must be zero or a positive whole number." };
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) return { ok: false, message: "Low stock threshold must be zero or a positive whole number." };
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true } });
  if (!variant) return { ok: false, message: "Variant not found." };
  await db.inventory.upsert({
    where: { variantId },
    create: { variantId, stock, lowStockThreshold },
    update: { stock, lowStockThreshold },
  });
  await syncProductAggregates(variant.productId);
  await audit({
    actorId: admin.id,
    action: "inventory.set",
    entity: "ProductVariant",
    entityId: variantId,
    before: { stock: variant.inventory?.stock ?? 0 },
    after: { stock },
  });
  revalidatePath(`/admin/products/${variant.productId}`);
  revalidatePath("/admin/inventory");
  return { ok: true, message: "Inventory updated." };
}

// ───────────────────────────── Images ─────────────────────────────

export async function uploadProductImage(productId: string, fd: FormData): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, message: "Product not found." };
  const file = fd.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Please choose an image file." };
  let url: string;
  try {
    url = await storeImage(file, "products");
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Could not upload image." };
  }
  const count = await db.productImage.count({ where: { productId } });
  await db.productImage.create({ data: { productId, url, alt: product.name, sortOrder: count } });
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Image uploaded." };
}

export async function deleteProductImage(imageId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const image = await db.productImage.findUnique({ where: { id: imageId }, include: { product: { select: { id: true, slug: true } } } });
  if (!image) return { ok: false, message: "Image not found." };
  await db.productImage.delete({ where: { id: imageId } });
  revalidatePath(`/admin/products/${image.product.id}`);
  revalidatePath(`/products/${image.product.slug}`);
  return { ok: true, message: "Image removed." };
}
