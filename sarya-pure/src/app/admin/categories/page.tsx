import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeleteCategoryButton } from "@/components/admin/category-row-actions";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Categories</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} categorie(s) total.</p>
        </div>
        <ButtonLink href="/admin/categories/new">+ New category</ButtonLink>
      </div>

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" text="Create your first category to start adding products." cta={{ href: "/admin/categories/new", label: "New category" }} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/categories/${c.id}`} className="font-semibold text-forest-800 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.slug}</td>
                  <td className="px-4 py-3">{c._count.products}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.isPublished ? "green" : "gray"}>{c.isPublished ? "Published" : "Draft"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/categories/${c.id}`} className="text-sm font-medium text-forest-800 hover:underline">
                        Edit
                      </Link>
                      <DeleteCategoryButton categoryId={c.id} name={c.name} />
                    </div>
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
