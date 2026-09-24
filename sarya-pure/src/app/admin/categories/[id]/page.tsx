import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-forest-900">{category.name}</h1>
      <CategoryForm category={category} />
    </div>
  );
}
