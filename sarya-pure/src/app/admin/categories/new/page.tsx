import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-forest-900">New category</h1>
      <CategoryForm />
    </div>
  );
}
