"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { slug, text, optionalText, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { storeImage, UploadError } from "@/lib/services/storage";
import { audit } from "@/lib/services/audit";

const categorySchema = z.object({
  name: text(80),
  slug,
  description: optionalText(500),
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  showOnHome: z.union([z.literal("on"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().default(0),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});

export async function createCategory(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = categorySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const taken = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (taken) return { ok: false, message: "A category with this slug already exists.", fieldErrors: { slug: "Already in use" } };

  let image: string | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      image = await storeImage(file, "categories");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Could not upload image." };
    }
  }

  const category = await db.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      image,
      isPublished: parsed.data.isPublished === "on",
      showOnHome: parsed.data.showOnHome === "on",
      sortOrder: parsed.data.sortOrder,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });
  await audit({ actorId: admin.id, action: "category.create", entity: "Category", entityId: category.id, after: { name: category.name } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { ok: true, message: "Category created.", data: { id: category.id } };
}

export async function updateCategory(categoryId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = categorySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const existing = await db.category.findUnique({ where: { id: categoryId } });
  if (!existing) return { ok: false, message: "Category not found." };
  const taken = await db.category.findFirst({ where: { slug: parsed.data.slug, NOT: { id: categoryId } } });
  if (taken) return { ok: false, message: "Slug already in use by another category.", fieldErrors: { slug: "Already in use" } };

  let image = existing.image;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      image = await storeImage(file, "categories");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Could not upload image." };
    }
  }

  await db.category.update({
    where: { id: categoryId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      image,
      isPublished: parsed.data.isPublished === "on",
      showOnHome: parsed.data.showOnHome === "on",
      sortOrder: parsed.data.sortOrder,
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });
  await audit({ actorId: admin.id, action: "category.update", entity: "Category", entityId: categoryId, after: { name: parsed.data.name } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath(`/category/${parsed.data.slug}`);
  return { ok: true, message: "Category saved." };
}

export async function deleteCategory(categoryId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("products:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const productCount = await db.product.count({ where: { categoryId } });
  if (productCount > 0) return { ok: false, message: `Cannot delete — ${productCount} product(s) still use this category. Move or delete them first.` };
  const category = await db.category.delete({ where: { id: categoryId } }).catch(() => null);
  if (!category) return { ok: false, message: "Category not found." };
  await audit({ actorId: admin.id, action: "category.delete", entity: "Category", entityId: categoryId, before: { name: category.name } });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { ok: true, message: "Category deleted." };
}
