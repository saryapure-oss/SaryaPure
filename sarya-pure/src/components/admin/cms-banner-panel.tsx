"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBanner, deleteBanner } from "@/app/actions/admin/cms";
import { Input, Select, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type Banner = { id: string; title: string; subtitle: string | null; link: string | null; ctaLabel: string | null; placement: string; isActive: boolean; sortOrder: number };

const PLACEMENTS = [
  { value: "HOME_HERO", label: "Home — Hero" },
  { value: "HOME_PROMO", label: "Home — Promo" },
  { value: "SHOP_TOP", label: "Shop — Top" },
];

function Fields({ b, state }: { b?: Banner; state: ActionState }) {
  const p = b ? `banner-${b.id}` : "new-banner";
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Title" name="title" id={`${p}-title`} required maxLength={120} defaultValue={b?.title} error={state.fieldErrors?.title} />
        <Input label="Subtitle" name="subtitle" id={`${p}-subtitle`} maxLength={200} defaultValue={b?.subtitle ?? ""} />
        <Input label="Link URL" name="link" id={`${p}-link`} maxLength={300} defaultValue={b?.link ?? ""} />
        <Input label="CTA label" name="ctaLabel" id={`${p}-ctaLabel`} maxLength={60} defaultValue={b?.ctaLabel ?? ""} />
        <Select label="Placement" name="placement" id={`${p}-placement`} defaultValue={b?.placement ?? "HOME_PROMO"} options={PLACEMENTS} />
        <Input label="Sort order" name="sortOrder" id={`${p}-sortOrder`} type="number" defaultValue={b?.sortOrder ?? 0} />
      </div>
      <Checkbox label="Active" name="isActive" defaultChecked={b?.isActive ?? true} />
    </>
  );
}

export function CmsBannerNewForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveBanner.bind(null, null), initialActionState);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-forest-800 hover:underline">
        + Add banner
      </button>
    );
  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-dashed border-beige-400 bg-white p-4">
      <Fields state={state} />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Adding…">
        Add
      </SubmitButton>
    </form>
  );
}

export function CmsBannerRow({ banner }: { banner: Banner }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveBanner.bind(null, banner.id), initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="rounded-xl border border-beige-300 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{banner.title}</p>
            {banner.subtitle && <p className="text-sm text-muted">{banner.subtitle}</p>}
            <p className="text-xs text-muted">{banner.placement}</p>
          </div>
          <Badge tone={banner.isActive ? "green" : "gray"}>{banner.isActive ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="mt-3 flex gap-3 text-sm font-medium">
          <button type="button" onClick={() => setEditing(true)} className="text-forest-800 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm("Delete this banner?")) return;
              start(async () => {
                const res = await deleteBanner(banner.id);
                toast(res.message, res.ok ? "success" : "error");
                router.refresh();
              });
            }}
            className="text-red-700 hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-beige-300 bg-beige-50 p-4">
      <Fields b={banner} state={state} />
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
  );
}
