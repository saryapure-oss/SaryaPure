"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/app/actions/admin/products";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  tags: string[];
  shortDescription: string | null;
  description: string | null;
  ingredients: string | null;
  nutritionInfo: string | null;
  allergens: string | null;
  storageInstructions: string | null;
  shippingInfo: string | null;
  taxRate: number | string;
  isPublished: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
};

export function ProductForm({ categories, product }: { categories: { id: string; name: string }[]; product?: Product }) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.id && !product) router.push(`/admin/products/${state.data.id}`);
  }, [state, product, router]);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-beige-300 bg-white p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Product name" name="name" required maxLength={150} defaultValue={product?.name} error={state.fieldErrors?.name} />
        <Input label="Slug" name="slug" required maxLength={80} defaultValue={product?.slug} hint="Used in the product URL." error={state.fieldErrors?.slug} />
        <Input label="SKU" name="sku" required maxLength={40} defaultValue={product?.sku} error={state.fieldErrors?.sku} />
        <Select
          label="Category"
          name="categoryId"
          required
          defaultValue={product?.categoryId}
          placeholder="Select a category"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          error={state.fieldErrors?.categoryId}
        />
        <Input label="Tags (comma-separated)" name="tags" maxLength={300} defaultValue={product?.tags?.join(", ")} />
        <Input label="GST rate (%)" name="taxRate" type="number" step="0.01" min={0} max={28} defaultValue={product ? String(product.taxRate) : "5"} error={state.fieldErrors?.taxRate} />
      </div>

      <Textarea label="Short description" name="shortDescription" maxLength={300} defaultValue={product?.shortDescription ?? ""} hint="Shown on listing cards." />
      <Textarea label="Full description" name="description" maxLength={5000} rows={6} defaultValue={product?.description ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Textarea label="Ingredients" name="ingredients" maxLength={2000} defaultValue={product?.ingredients ?? ""} />
        <Textarea label="Nutrition information" name="nutritionInfo" maxLength={2000} defaultValue={product?.nutritionInfo ?? ""} />
        <Textarea label="Allergens" name="allergens" maxLength={500} defaultValue={product?.allergens ?? ""} />
        <Textarea label="Storage instructions" name="storageInstructions" maxLength={500} defaultValue={product?.storageInstructions ?? ""} />
      </div>
      <Textarea label="Shipping information" name="shippingInfo" maxLength={500} defaultValue={product?.shippingInfo ?? ""} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Checkbox label="Published (visible on the storefront)" name="isPublished" defaultChecked={product?.isPublished} />
        <Checkbox label="Featured on homepage" name="isFeatured" defaultChecked={product?.isFeatured} />
        <Checkbox label="Best seller" name="isBestSeller" defaultChecked={product?.isBestSeller} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="SEO title" name="seoTitle" maxLength={120} defaultValue={product?.seoTitle ?? ""} />
        <Input label="SEO description" name="seoDescription" maxLength={300} defaultValue={product?.seoDescription ?? ""} />
      </div>

      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Saving…">{product ? "Save product" : "Create product"}</SubmitButton>
    </form>
  );
}
