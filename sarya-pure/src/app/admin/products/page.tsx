import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR } from "@/lib/money";
import { PublishToggle, DeleteProductButton } from "@/components/admin/product-row-actions";

export const metadata = { title: "Products" };

const PAGE_SIZE = 20;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(status === "published" ? { isPublished: true } : status === "unpublished" ? { isPublished: false } : {}),
  };

  const [products, total, categories] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        _count: { select: { variants: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
    db.category.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const missingImages = await db.product.count({ where: { images: { none: {} } } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Products</h1>
          <p className="mt-1 text-sm text-muted">{total} product(s) total.</p>
        </div>
        <ButtonLink href="/admin/products/new">+ New product</ButtonLink>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="Search name or SKU…" className="h-10 w-64 rounded-lg border border-beige-400 bg-white px-3 text-sm" />
        <select name="status" defaultValue={status} className="h-10 rounded-lg border border-beige-400 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <button type="submit" className="h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50">
          Filter
        </button>
      </form>

      {categories === 0 && (
        <p className="rounded-lg border border-gold-500/40 bg-gold-300/10 px-4 py-3 text-sm">
          You have no categories yet. <Link href="/admin/categories/new" className="font-semibold underline">Create one first</Link> before adding products.
        </p>
      )}

      {missingImages > 0 && (
        <p className="rounded-lg border border-red-400/50 bg-red-50 px-4 py-3 text-sm text-red-800">
          {missingImages} product{missingImages === 1 ? " has" : "s have"} no image yet — customers will see a blank tile. Open each product below (look for the &ldquo;No image&rdquo; badge) and add at
          least one photo.
        </p>
      )}

      {products.length === 0 ? (
        <EmptyState title="No products found" text="Try a different search, or create your first product." cta={{ href: "/admin/products/new", label: "New product" }} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price from</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">
                    {p.images[0] ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-beige-300 bg-cream-200">
                        <SmartImage src={p.images[0].url} alt={p.images[0].alt ?? p.name} fill sizes="48px" className="object-cover" />
                      </div>
                    ) : (
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-red-400 bg-red-50 text-center text-[10px] font-semibold leading-tight text-red-700">
                        No image
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-forest-800 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted">{p.sku}</p>
                  </td>
                  <td className="px-4 py-3">{p.category.name}</td>
                  <td className="px-4 py-3">{p.minPrice ? formatINR(p.minPrice) : "—"}</td>
                  <td className="px-4 py-3">{p._count.variants}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.inStock ? "green" : "red"}>{p.inStock ? "In stock" : "Out of stock"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.isPublished ? "green" : "gray"}>{p.isPublished ? "Published" : "Draft"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <PublishToggle productId={p.id} isPublished={p.isPublished} />
                      <DeleteProductButton productId={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/products" params={{ q, status }} />
    </div>
  );
}
