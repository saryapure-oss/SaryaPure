"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createVariant, updateVariant, deleteVariant, setInventory } from "@/app/actions/admin/products";
import { Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/money";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type Variant = {
  id: string;
  name: string;
  sku: string;
  weightGrams: number | null;
  price: number;
  mrp: number;
  isActive: boolean;
  isDefault: boolean;
  inventory: { stock: number; reserved: number; lowStockThreshold: number } | null;
};

function StockEditor({ variantId, inventory }: { variantId: string; inventory: Variant["inventory"] }) {
  const [stock, setStock] = useState(String(inventory?.stock ?? 0));
  const [threshold, setThreshold] = useState(String(inventory?.lowStockThreshold ?? 10));
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const available = (inventory?.stock ?? 0) - (inventory?.reserved ?? 0);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">
        Stock
        <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className="mt-0.5 block h-8 w-20 rounded border border-beige-400 px-2 text-sm" />
      </label>
      <label className="text-xs">
        Low-stock at
        <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} className="mt-0.5 block h-8 w-20 rounded border border-beige-400 px-2 text-sm" />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await setInventory(variantId, Number(stock), Number(threshold));
            toast(res.message, res.ok ? "success" : "error");
            router.refresh();
          })
        }
        className="h-8 rounded bg-forest-900 px-3 text-xs font-semibold text-cream-50 disabled:opacity-50"
      >
        Save
      </button>
      {inventory && <span className="text-xs text-muted">{available} available ({inventory.reserved} reserved)</span>}
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(updateVariant.bind(null, variant.id), initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!editing) {
    return (
      <tr className="border-b border-beige-200 last:border-0">
        <td className="px-3 py-2.5">
          {variant.name} {variant.isDefault && <Badge tone="gold">Default</Badge>}
        </td>
        <td className="px-3 py-2.5 text-xs text-muted">{variant.sku}</td>
        <td className="px-3 py-2.5">
          {formatINR(variant.price)} <span className="text-xs text-muted line-through">{formatINR(variant.mrp)}</span>
        </td>
        <td className="px-3 py-2.5">
          <Badge tone={variant.isActive ? "green" : "gray"}>{variant.isActive ? "Active" : "Inactive"}</Badge>
        </td>
        <td className="px-3 py-2.5">
          <StockEditor variantId={variant.id} inventory={variant.inventory} />
        </td>
        <td className="px-3 py-2.5 text-right">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-forest-800 hover:underline">
              Edit
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Delete variant "${variant.name}"?`)) return;
                start(async () => {
                  const res = await deleteVariant(variant.id);
                  toast(res.message, res.ok ? "success" : "error");
                  router.refresh();
                });
              }}
              className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-beige-200 last:border-0 bg-beige-50">
      <td colSpan={6} className="px-3 py-4">
        <form action={formAction} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Name" name="name" id={`variant-${variant.id}-name`} required defaultValue={variant.name} error={state.fieldErrors?.name} />
            <Input label="SKU" name="sku" id={`variant-${variant.id}-sku`} required defaultValue={variant.sku} error={state.fieldErrors?.sku} />
            <Input label="Weight (grams)" name="weightGrams" id={`variant-${variant.id}-weightGrams`} type="number" min={0} defaultValue={variant.weightGrams ?? ""} />
            <Input label="Price (₹, paise)" name="price" id={`variant-${variant.id}-price`} type="number" min={1} required defaultValue={variant.price} error={state.fieldErrors?.price} />
            <Input label="MRP (₹, paise)" name="mrp" id={`variant-${variant.id}-mrp`} type="number" min={1} required defaultValue={variant.mrp} error={state.fieldErrors?.mrp} />
          </div>
          <div className="flex gap-4">
            <Checkbox label="Active" name="isActive" defaultChecked={variant.isActive} />
            <Checkbox label="Default variant" name="isDefault" defaultChecked={variant.isDefault} />
          </div>
          <FormMessage ok={state.ok} message={state.message} />
          <div className="flex gap-3">
            <SubmitButton size="sm" pendingText="Saving…">
              Save
            </SubmitButton>
            <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-muted hover:underline">
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export function VariantsPanel({ productId, variants }: { productId: string; variants: Variant[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createVariant.bind(null, productId), initialActionState);
  const [adding, setAdding] = useState(variants.length === 0);

  return (
    <div className="rounded-2xl border border-beige-300 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Variants &amp; inventory</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-sm font-semibold text-forest-800 hover:underline">
            + Add variant
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">Prices are in paise (₹1 = 100). Enter e.g. 45000 for ₹450.00.</p>

      {variants.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Inventory</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <VariantRow key={v.id} variant={v} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && (
        <form action={formAction} className="mt-5 space-y-3 rounded-xl border border-dashed border-beige-400 p-4">
          <h3 className="text-sm font-semibold">New variant</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Variant name (e.g. 250 g)" name="name" id="new-variant-name" required error={state.fieldErrors?.name} />
            <Input label="Variant SKU" name="sku" id="new-variant-sku" required error={state.fieldErrors?.sku} />
            <Input label="Weight (grams)" name="weightGrams" id="new-variant-weightGrams" type="number" min={0} />
            <Input label="Price (paise)" name="price" id="new-variant-price" type="number" min={1} required error={state.fieldErrors?.price} />
            <Input label="MRP (paise)" name="mrp" id="new-variant-mrp" type="number" min={1} required error={state.fieldErrors?.mrp} />
            <Input label="Initial stock" name="initialStock" id="new-variant-initialStock" type="number" min={0} defaultValue={0} />
            <Input label="Low-stock threshold" name="lowStockThreshold" id="new-variant-lowStockThreshold" type="number" min={0} defaultValue={10} />
          </div>
          <div className="flex gap-4">
            <Checkbox label="Active" name="isActive" defaultChecked />
            <Checkbox label="Default variant" name="isDefault" defaultChecked={variants.length === 0} />
          </div>
          <FormMessage ok={state.ok} message={state.message} />
          <div className="flex gap-3">
            <SubmitButton size="sm" pendingText="Adding…">
              Add variant
            </SubmitButton>
            {variants.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="text-sm font-medium text-muted hover:underline">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
