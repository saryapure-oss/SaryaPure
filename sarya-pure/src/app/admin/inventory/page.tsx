import Link from "next/link";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Inventory" };

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filter = sp.filter ?? "low";

  const condition = filter === "out" ? Prisma.sql`i."stock" <= 0` : Prisma.sql`i."stock" > 0 AND i."stock" <= i."lowStockThreshold"`;
  const rows = await db.$queryRaw<
    { variantId: string; stock: number; reserved: number; lowStockThreshold: number; variantName: string; productId: string; productName: string; sku: string }[]
  >(Prisma.sql`
    SELECT i."variantId", i."stock", i."reserved", i."lowStockThreshold",
           v."name" AS "variantName", v."sku", p."id" AS "productId", p."name" AS "productName"
    FROM "Inventory" i
    JOIN "ProductVariant" v ON v."id" = i."variantId"
    JOIN "Product" p ON p."id" = v."productId"
    WHERE ${condition}
    ORDER BY i."stock" ASC
    LIMIT 200`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Inventory</h1>
        <p className="mt-1 text-sm text-muted">Stock levels that need attention. Manage exact stock from each product&apos;s page.</p>
      </div>

      <div className="flex gap-2">
        <Link href="/admin/inventory?filter=low" className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === "low" ? "bg-forest-900 text-cream-50" : "bg-beige-200"}`}>
          Low stock
        </Link>
        <Link href="/admin/inventory?filter=out" className={`rounded-full px-4 py-1.5 text-sm font-medium ${filter === "out" ? "bg-forest-900 text-cream-50" : "bg-beige-200"}`}>
          Out of stock
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="All clear" text="No variants match this filter right now." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Variant</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Threshold</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.variantId} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">{r.productName}</td>
                  <td className="px-4 py-3">{r.variantName}</td>
                  <td className="px-4 py-3 text-muted">{r.sku}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.stock <= 0 ? "red" : "gold"}>{r.stock}</Badge>
                  </td>
                  <td className="px-4 py-3">{r.reserved}</td>
                  <td className="px-4 py-3">{r.lowStockThreshold}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/products/${r.productId}`} className="text-sm font-medium text-forest-800 hover:underline">
                      Manage stock
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
