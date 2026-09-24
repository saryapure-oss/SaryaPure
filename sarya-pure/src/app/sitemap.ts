import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

const POLICY_SLUGS = ["shipping-policy", "return-refund-policy", "cancellation-policy", "privacy-policy", "terms-and-conditions", "cookie-policy"];

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.7 },
  { path: "/gift-hampers", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/b2b", changeFrequency: "monthly", priority: 0.5 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/track-order", changeFrequency: "monthly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, policies] = await Promise.all([
    db.product.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    db.policyPage.findMany({ where: { slug: { in: POLICY_SLUGS } }, select: { slug: true, updatedAt: true } }),
  ]);

  const now = new Date();

  return [
    ...STATIC_ROUTES.map((r) => ({ url: siteUrl(r.path), lastModified: now, changeFrequency: r.changeFrequency, priority: r.priority })),
    ...categories.map((c) => ({ url: siteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: siteUrl(`/products/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...policies.map((p) => ({ url: siteUrl(`/policies/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
