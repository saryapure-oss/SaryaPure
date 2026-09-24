"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser, assertPermission } from "@/lib/auth/guards";
import { id, text, optionalText, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { hasPurchased } from "@/lib/services/orders";
import { rateLimit } from "@/lib/security/rate-limit";
import { syncProductAggregates } from "@/lib/services/inventory";
import { storeImage, UploadError } from "@/lib/services/storage";
import { audit } from "@/lib/services/audit";

const reviewSchema = z.object({
  productId: id,
  rating: z.coerce.number().int().min(1, "Please select a rating").max(5),
  title: optionalText(120),
  body: text(2000, 10),
});

export async function submitReview(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in to write a review." };
  if (!(await rateLimit(`review:${user.id}`, 10, 3600))) return { ok: false, message: "Too many reviews submitted. Please try again later." };

  const parsed = reviewSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const product = await db.product.findFirst({ where: { id: parsed.data.productId, isPublished: true } });
  if (!product) return { ok: false, message: "Product not found." };
  const purchased = await hasPurchased(user.id, product.id);
  if (!purchased) return { ok: false, message: "You can review a product only after purchasing it." };

  const existing = await db.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } });
  if (existing) return { ok: false, message: "You have already reviewed this product." };

  let imageUrl: string | null = null;
  const file = fd.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await storeImage(file, "reviews");
    } catch (e) {
      return { ok: false, message: e instanceof UploadError ? e.message : "Could not upload image." };
    }
  }

  await db.review.create({
    data: { productId: product.id, userId: user.id, rating: parsed.data.rating, title: parsed.data.title, body: parsed.data.body, imageUrl, isVerifiedPurchase: true, status: "PENDING" },
  });
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Thank you! Your review has been submitted and will appear once approved." };
}

export async function moderateReview(reviewId: string, action: "APPROVE" | "REJECT" | "DELETE"): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("reviews:moderate").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const review = await db.review.findUnique({ where: { id: reviewId }, include: { product: true } });
  if (!review) return { ok: false, message: "Review not found." };

  if (action === "DELETE") {
    await db.review.delete({ where: { id: reviewId } });
  } else {
    await db.review.update({ where: { id: reviewId }, data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" } });
  }
  await syncProductAggregates(review.productId);
  await audit({ actorId: admin.id, action: `review.${action.toLowerCase()}`, entity: "Review", entityId: reviewId, before: { status: review.status } });
  revalidatePath(`/products/${review.product.slug}`);
  revalidatePath("/admin/reviews");
  return { ok: true, message: `Review ${action === "DELETE" ? "deleted" : action.toLowerCase() + "d"}.` };
}

export async function toggleFeaturedReview(reviewId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("reviews:moderate").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { ok: false, message: "Review not found." };
  await db.review.update({ where: { id: reviewId }, data: { isFeatured: !review.isFeatured } });
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { ok: true, message: review.isFeatured ? "Removed from homepage." : "Featured on homepage." };
}
