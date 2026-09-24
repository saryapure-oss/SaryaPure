import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">New product</h1>
        <p className="mt-1 text-sm text-muted">You can add variants, inventory and images after saving the basic details.</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
