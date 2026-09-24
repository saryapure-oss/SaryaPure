"use client";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGiftBox, deleteGiftBox, updateGiftBox, addGiftBoxItem, removeGiftBoxItem } from "@/app/actions/admin/giftbox";
import { Input, Select, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { formatINR } from "@/lib/money";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type GiftBoxItem = { id: string; quantity: number; variant: { id: string; name: string; sku: string; price: number; product: { name: string } } };
type GiftBox = { id: string; type: string; allowGiftMessage: boolean; items: GiftBoxItem[] };

const TYPES = ["PREMIUM", "CORPORATE", "FESTIVAL", "WEDDING", "CUSTOM"];

export function GiftBoxPanel({ productId, giftBox }: { productId: string; giftBox: GiftBox | null }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!giftBox) {
    return (
      <div className="rounded-2xl border border-beige-300 bg-white p-5">
        <h2 className="font-semibold">Gift Box</h2>
        <p className="mt-1 text-sm text-muted">
          Turn this product into a gift box made up of other products&apos; variants (e.g. one gift box = 1 almonds 250 g + 1 cashews 250 g + 1 dates 250 g).
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await createGiftBox(productId, "PREMIUM");
              toast(res.message, res.ok ? "success" : "error");
              router.refresh();
            })
          }
          className="mt-4 h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50 disabled:opacity-50"
        >
          Make this a gift box
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-beige-300 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold">Gift Box Contents</h2>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Remove gift box configuration? Its contents list will be deleted and this becomes a regular product.")) return;
            start(async () => {
              const res = await deleteGiftBox(productId);
              toast(res.message, res.ok ? "success" : "error");
              router.refresh();
            });
          }}
          className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
        >
          Remove gift box
        </button>
      </div>

      <GiftBoxSettingsForm giftBox={giftBox} />

      <div>
        <p className="text-sm font-medium text-ink">Contents</p>
        {giftBox.items.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800">
            No items yet — add at least one variant below so customers know what&apos;s inside this box.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-beige-200 rounded-xl border border-beige-300">
            {giftBox.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span>
                  {item.quantity} × {item.variant.product.name} — {item.variant.name}{" "}
                  <span className="text-muted">
                    ({item.variant.sku}, {formatINR(item.variant.price)} each)
                  </span>
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await removeGiftBoxItem(item.id);
                      toast(res.message, res.ok ? "success" : "error");
                      router.refresh();
                    })
                  }
                  className="shrink-0 text-red-700 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddItemForm giftBoxId={giftBox.id} />
    </div>
  );
}

function GiftBoxSettingsForm({ giftBox }: { giftBox: GiftBox }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateGiftBox.bind(null, giftBox.id), initialActionState);
  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Occasion type" name="type" options={TYPES} defaultValue={giftBox.type} />
        <div className="flex items-end pb-2.5">
          <Checkbox label="Allow customers to add a gift message at checkout" name="allowGiftMessage" defaultChecked={giftBox.allowGiftMessage} />
        </div>
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Saving…">
        Save gift box settings
      </SubmitButton>
    </form>
  );
}

function AddItemForm({ giftBoxId }: { giftBoxId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addGiftBoxItem.bind(null, giftBoxId), initialActionState);
  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-dashed border-beige-400 p-4">
      <p className="text-sm font-medium text-ink">Add an item by variant SKU</p>
      <p className="text-xs text-muted">Find the SKU on the variant&apos;s own product page (e.g. SP-ALM-CAL-250G).</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Input label="Variant SKU" name="sku" required maxLength={40} error={state.fieldErrors?.sku} />
        <Input label="Quantity" name="quantity" type="number" min={1} max={20} defaultValue={1} error={state.fieldErrors?.quantity} />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Adding…">
        Add to box
      </SubmitButton>
    </form>
  );
}
