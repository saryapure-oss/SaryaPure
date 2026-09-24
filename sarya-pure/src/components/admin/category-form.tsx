"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory } from "@/app/actions/admin/categories";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { SmartImage } from "@/components/ui/smart-image";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isPublished: boolean;
  showOnHome: boolean;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function CategoryForm({ category }: { category?: Category }) {
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction] = useActionState<ActionState, FormData>(action, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.id && !category) router.push(`/admin/categories/${state.data.id}`);
  }, [state, category, router]);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-beige-300 bg-white p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Name" name="name" required maxLength={80} defaultValue={category?.name} error={state.fieldErrors?.name} />
        <Input label="Slug" name="slug" required maxLength={80} defaultValue={category?.slug} error={state.fieldErrors?.slug} />
      </div>
      <Textarea label="Description" name="description" maxLength={500} defaultValue={category?.description ?? ""} />

      {category?.image && (
        <div className="h-20 w-20 overflow-hidden rounded-lg border border-beige-300">
          <SmartImage src={category.image} alt="" width={80} height={80} className="h-full w-full object-cover" />
        </div>
      )}
      <label className="block text-sm font-medium">
        {category?.image ? "Replace image" : "Image"}
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1.5 block text-sm" />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <Input label="Sort order" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} />
        <Checkbox label="Published" name="isPublished" defaultChecked={category?.isPublished ?? true} />
        <Checkbox label="Show on homepage" name="showOnHome" defaultChecked={category?.showOnHome ?? true} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="SEO title" name="seoTitle" maxLength={120} defaultValue={category?.seoTitle ?? ""} />
        <Input label="SEO description" name="seoDescription" maxLength={300} defaultValue={category?.seoDescription ?? ""} />
      </div>

      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Saving…">{category ? "Save category" : "Create category"}</SubmitButton>
    </form>
  );
}
