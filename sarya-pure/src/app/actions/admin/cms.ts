"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { text, optionalText, slug as slugSchema, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { audit } from "@/lib/services/audit";

// ───────────────────────────── FAQs ─────────────────────────────

const faqSchema = z.object({
  question: text(300),
  answer: text(2000),
  category: optionalText(60),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  showOnHome: z.union([z.literal("on"), z.literal("")]).optional(),
});

export async function saveFaq(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = faqSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const data = {
    question: parsed.data.question,
    answer: parsed.data.answer,
    category: parsed.data.category || "General",
    sortOrder: parsed.data.sortOrder,
    isPublished: parsed.data.isPublished === "on",
    showOnHome: parsed.data.showOnHome === "on",
  };
  if (id) await db.fAQ.update({ where: { id }, data });
  else await db.fAQ.create({ data });
  await audit({ actorId: admin.id, action: id ? "faq.update" : "faq.create", entity: "FAQ", entityId: id ?? undefined });
  revalidatePath("/admin/cms/faqs");
  revalidatePath("/faq");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function deleteFaq(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.fAQ.delete({ where: { id } }).catch(() => null);
  await audit({ actorId: admin.id, action: "faq.delete", entity: "FAQ", entityId: id });
  revalidatePath("/admin/cms/faqs");
  revalidatePath("/faq");
  return { ok: true, message: "Deleted." };
}

// ───────────────────────────── Testimonials ─────────────────────────────

const testimonialSchema = z.object({
  name: text(80),
  location: optionalText(80),
  content: text(600),
  rating: z.coerce.number().int().min(1).max(5),
  isDemo: z.union([z.literal("on"), z.literal("")]).optional(),
  isPublished: z.union([z.literal("on"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveTestimonial(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = testimonialSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const data = {
    name: parsed.data.name,
    location: parsed.data.location,
    content: parsed.data.content,
    rating: parsed.data.rating,
    isDemo: parsed.data.isDemo === "on",
    isPublished: parsed.data.isPublished === "on",
    sortOrder: parsed.data.sortOrder,
  };
  if (id) await db.testimonial.update({ where: { id }, data });
  else await db.testimonial.create({ data });
  await audit({ actorId: admin.id, action: id ? "testimonial.update" : "testimonial.create", entity: "Testimonial", entityId: id ?? undefined });
  revalidatePath("/admin/cms/testimonials");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function deleteTestimonial(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.testimonial.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/cms/testimonials");
  revalidatePath("/");
  return { ok: true, message: "Deleted." };
}

// ───────────────────────────── Banners ─────────────────────────────

const bannerSchema = z.object({
  title: text(120),
  subtitle: optionalText(200),
  link: optionalText(300),
  ctaLabel: optionalText(60),
  placement: z.enum(["HOME_HERO", "HOME_PROMO", "SHOP_TOP"]),
  isActive: z.union([z.literal("on"), z.literal("")]).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export async function saveBanner(id: string | null, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = bannerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const data = {
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    link: parsed.data.link,
    ctaLabel: parsed.data.ctaLabel,
    placement: parsed.data.placement,
    isActive: parsed.data.isActive === "on",
    sortOrder: parsed.data.sortOrder,
  };
  if (id) await db.banner.update({ where: { id }, data });
  else await db.banner.create({ data });
  revalidatePath("/admin/cms/banners");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function deleteBanner(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.banner.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/cms/banners");
  revalidatePath("/");
  return { ok: true, message: "Deleted." };
}

// ───────────────────────────── Policy pages ─────────────────────────────

const policySchema = z.object({
  slug: slugSchema,
  title: text(150),
  content: text(20000, 10),
  isPlaceholder: z.union([z.literal("on"), z.literal("")]).optional(),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
});

export async function savePolicyPage(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("cms:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = policySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const existing = await db.policyPage.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Policy page not found." };
  await db.policyPage.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      isPlaceholder: parsed.data.isPlaceholder === "on",
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
    },
  });
  await audit({ actorId: admin.id, action: "policy.update", entity: "PolicyPage", entityId: id });
  revalidatePath("/admin/cms/policies");
  revalidatePath(`/policies/${existing.slug}`);
  return { ok: true, message: "Saved." };
}
