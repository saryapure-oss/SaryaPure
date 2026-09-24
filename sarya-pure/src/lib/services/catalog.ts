import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_SIZE = 12;

export const SORTS = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  popular: "Popular",
  rating: "Top Rated",
} as const;
export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  q?: string;
  category?: string;
  minPrice?: number; // paise
  maxPrice?: number; // paise
  rating?: number;
  inStock?: boolean;
  discount?: number; // min discount %
  weight?: number; // grams
  sort?: SortKey;
  page?: number;
};

export const cardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  minPrice: true,
  maxDiscountPct: true,
  inStock: true,
  avgRating: true,
  reviewCount: true,
  isBestSeller: true,
  isDemo: true,
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { url: true, alt: true } },
  variants: {
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" as const }, { sortOrder: "asc" as const }],
    take: 1,
    select: { id: true, name: true, price: true, mrp: true, inventory: { select: { stock: true, reserved: true } } },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export function buildProductWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isPublished: true, category: { isPublished: true } }];
  if (f.q) {
    const q = f.q.trim().slice(0, 80);
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: tokens } },
        { category: { name: { contains: q, mode: "insensitive" } } },
        { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
        { shortDescription: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (f.category) and.push({ category: { slug: f.category } });
  if (f.minPrice != null) and.push({ minPrice: { gte: f.minPrice } });
  if (f.maxPrice != null) and.push({ minPrice: { lte: f.maxPrice } });
  if (f.rating) and.push({ avgRating: { gte: f.rating } });
  if (f.inStock) and.push({ inStock: true });
  if (f.discount) and.push({ maxDiscountPct: { gte: f.discount } });
  if (f.weight) and.push({ variants: { some: { weightGrams: f.weight, isActive: true } } });
  return { AND: and };
}

function orderBy(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ minPrice: "asc" }];
    case "price-desc":
      return [{ minPrice: "desc" }];
    case "popular":
      return [{ soldCount: "desc" }, { reviewCount: "desc" }];
    case "rating":
      return [{ avgRating: "desc" }, { reviewCount: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(f: ProductFilters) {
  const where = buildProductWhere(f);
  const page = Math.max(1, Math.min(f.page ?? 1, 500));
  const [items, total] = await Promise.all([
    db.product.findMany({ where, orderBy: orderBy(f.sort), skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: cardSelect }),
    db.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 100);
  };
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const sort = one("sort");
  return {
    q: one("q")?.trim() || undefined,
    category: one("category") && /^[a-z0-9-]+$/.test(one("category")!) ? one("category") : undefined,
    minPrice: num("min") != null ? Math.round(num("min")! * 100) : undefined,
    maxPrice: num("max") != null ? Math.round(num("max")! * 100) : undefined,
    rating: num("rating") ? Math.min(5, num("rating")!) : undefined,
    inStock: one("stock") === "1",
    discount: num("discount") ? Math.min(90, num("discount")!) : undefined,
    weight: num("weight") ? Math.round(num("weight")!) : undefined,
    sort: sort && sort in SORTS ? (sort as SortKey) : undefined,
    page: num("page") ? Math.floor(num("page")!) : 1,
  };
}

export const getPublishedCategories = cache(async () =>
  db.category.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true, image: true, showOnHome: true, _count: { select: { products: { where: { isPublished: true } } } } },
  }),
);

export const getProductBySlug = cache(async (slug: string) =>
  db.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { weightGrams: "asc" }], include: { inventory: true } },
      giftBox: { include: { items: { include: { variant: { include: { product: { select: { name: true, slug: true } } } } } } } },
    },
  }),
);

export async function getRelatedProducts(productId: string, categoryId: string, take = 4) {
  return db.product.findMany({
    where: { isPublished: true, categoryId, id: { not: productId } },
    orderBy: [{ soldCount: "desc" }, { createdAt: "desc" }],
    take,
    select: cardSelect,
  });
}

/** "Frequently bought together": products co-occurring in paid orders; falls back to best sellers from other categories. */
export async function getBoughtTogether(productId: string, categoryId: string, take = 3) {
  const rows = await db.$queryRaw<{ productId: string; n: bigint }[]>`
    SELECT oi2."productId", COUNT(*) AS n
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId" AND oi2."productId" <> oi1."productId"
    JOIN "Order" o ON o."id" = oi1."orderId" AND o."status" NOT IN ('CANCELLED', 'PENDING')
    WHERE oi1."productId" = ${productId} AND oi2."productId" IS NOT NULL
    GROUP BY oi2."productId" ORDER BY n DESC LIMIT ${take}`;
  const ids = rows.map((r) => r.productId);
  const found = ids.length
    ? await db.product.findMany({ where: { id: { in: ids }, isPublished: true }, select: cardSelect })
    : [];
  if (found.length >= take) return found;
  const extra = await db.product.findMany({
    where: { isPublished: true, id: { notIn: [productId, ...found.map((f) => f.id)] }, categoryId: { not: categoryId }, category: { slug: { not: "gift-hampers" } } },
    orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
    take: take - found.length,
    select: cardSelect,
  });
  return [...found, ...extra];
}

export async function searchSuggestions(q: string) {
  const query = q.trim().slice(0, 60);
  if (query.length < 2) return { products: [], categories: [] };
  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: buildProductWhere({ q: query }),
      take: 6,
      orderBy: [{ soldCount: "desc" }],
      select: { name: true, slug: true, minPrice: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } },
    }),
    db.category.findMany({ where: { isPublished: true, name: { contains: query, mode: "insensitive" } }, take: 3, select: { name: true, slug: true } }),
  ]);
  return {
    products: products.map((p) => ({ name: p.name, slug: p.slug, price: p.minPrice, image: p.images[0]?.url ?? null })),
    categories,
  };
}

export async function getWeightOptions(): Promise<number[]> {
  const rows = await db.productVariant.findMany({
    where: { isActive: true, weightGrams: { not: null }, product: { isPublished: true } },
    distinct: ["weightGrams"],
    select: { weightGrams: true },
    orderBy: { weightGrams: "asc" },
  });
  return rows.map((r) => r.weightGrams!).filter(Boolean);
}
