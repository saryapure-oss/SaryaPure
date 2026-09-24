"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCoupon, updateCoupon } from "@/app/actions/admin/coupons";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  scope: "ALL" | "PRODUCTS" | "CATEGORIES";
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  products?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
};

function toInputDate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function CouponForm({
  coupon,
  products,
  categories,
}: {
  coupon?: Coupon;
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const action = coupon ? updateCoupon.bind(null, coupon.id) : createCoupon;
  const [state, formAction] = useActionState<ActionState, FormData>(action, initialActionState);
  const [scope, setScope] = useState(coupon?.scope ?? "ALL");
  const [type, setType] = useState(coupon?.type ?? "PERCENTAGE");
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.data?.id && !coupon) router.push(`/admin/coupons/${state.data.id}`);
  }, [state, coupon, router]);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-beige-300 bg-white p-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Coupon code" name="code" required maxLength={30} defaultValue={coupon?.code} hint="Letters, numbers, - and _." error={state.fieldErrors?.code} />
        <Select
          label="Type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
          options={[
            { value: "PERCENTAGE", label: "Percentage off" },
            { value: "FIXED", label: "Fixed amount off (paise)" },
          ]}
        />
        <Input label={type === "PERCENTAGE" ? "Discount %" : "Discount (paise)"} name="value" type="number" min={1} required defaultValue={coupon?.value} error={state.fieldErrors?.value} />
        <Input label="Min order amount (paise)" name="minOrderAmount" type="number" min={0} defaultValue={coupon?.minOrderAmount ?? 0} />
        <Input label="Max discount cap (paise, optional)" name="maxDiscount" type="number" min={0} defaultValue={coupon?.maxDiscount ?? ""} />
        <Input label="Usage limit (total, optional)" name="usageLimit" type="number" min={1} defaultValue={coupon?.usageLimit ?? ""} />
        <Input label="Per-user limit (optional)" name="perUserLimit" type="number" min={1} defaultValue={coupon?.perUserLimit ?? ""} />
        <Select
          label="Applies to"
          name="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as typeof scope)}
          options={[
            { value: "ALL", label: "All products" },
            { value: "PRODUCTS", label: "Specific products" },
            { value: "CATEGORIES", label: "Specific categories" },
          ]}
        />
        <Input label="Starts on (optional)" name="startsAt" type="date" defaultValue={toInputDate(coupon?.startsAt ?? null)} />
        <Input label="Expires on (optional)" name="expiresAt" type="date" defaultValue={toInputDate(coupon?.expiresAt ?? null)} />
      </div>

      {scope === "PRODUCTS" && (
        <div>
          <label className="text-sm font-medium">Products</label>
          <select name="productIds" multiple defaultValue={coupon?.products?.map((p) => p.id) ?? []} className="mt-1.5 h-40 w-full rounded-lg border border-beige-400 bg-white p-2 text-sm">
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {scope === "CATEGORIES" && (
        <div>
          <label className="text-sm font-medium">Categories</label>
          <select name="categoryIds" multiple defaultValue={coupon?.categories?.map((c) => c.id) ?? []} className="mt-1.5 h-40 w-full rounded-lg border border-beige-400 bg-white p-2 text-sm">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Textarea label="Description (optional, internal)" name="description" maxLength={300} defaultValue={coupon?.description ?? ""} />
      <Checkbox label="Active" name="isActive" defaultChecked={coupon?.isActive ?? true} />

      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Saving…">{coupon ? "Save coupon" : "Create coupon"}</SubmitButton>
    </form>
  );
}
