"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveShippingZone, deleteShippingZone } from "@/app/actions/admin/shipping";
import { Input, Checkbox } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/money";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";

type Zone = {
  id: string;
  name: string;
  pincodePrefixes: string[];
  rate: number;
  freeAbove: number | null;
  etaMinDays: number;
  etaMaxDays: number;
  codAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
};

function Fields({ z, state }: { z?: Zone; state: ActionState }) {
  const p = z ? `zone-${z.id}` : "new-zone";
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Zone name" name="name" id={`${p}-name`} required maxLength={80} defaultValue={z?.name} error={state.fieldErrors?.name} />
        <Input
          label="PIN prefixes (comma-separated)"
          name="pincodePrefixes"
          id={`${p}-pincodePrefixes`}
          required
          maxLength={500}
          defaultValue={z?.pincodePrefixes.join(", ")}
          error={state.fieldErrors?.pincodePrefixes}
        />
        <Input label="Shipping rate (paise)" name="rate" id={`${p}-rate`} type="number" min={0} required defaultValue={z?.rate} />
        <Input label="Free shipping above (paise, optional)" name="freeAbove" id={`${p}-freeAbove`} type="number" min={0} defaultValue={z?.freeAbove ?? ""} />
        <Input label="ETA min (days)" name="etaMinDays" id={`${p}-etaMinDays`} type="number" min={0} defaultValue={z?.etaMinDays ?? 3} />
        <Input label="ETA max (days)" name="etaMaxDays" id={`${p}-etaMaxDays`} type="number" min={0} defaultValue={z?.etaMaxDays ?? 7} />
        <Input label="Sort order" name="sortOrder" id={`${p}-sortOrder`} type="number" defaultValue={z?.sortOrder ?? 0} />
      </div>
      <div className="flex gap-4">
        <Checkbox label="COD available" name="codAvailable" defaultChecked={z?.codAvailable ?? true} />
        <Checkbox label="Active" name="isActive" defaultChecked={z?.isActive ?? true} />
      </div>
    </>
  );
}

export function ShippingZoneNewForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveShippingZone.bind(null, null), initialActionState);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-forest-800 hover:underline">
        + Add zone
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

export function ShippingZoneRow({ zone }: { zone: Zone }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<ActionState, FormData>(saveShippingZone.bind(null, zone.id), initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  if (!editing) {
    return (
      <div className="rounded-xl border border-beige-300 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{zone.name}</p>
            <p className="text-sm text-muted">
              {zone.pincodePrefixes.join(", ")} · {formatINR(zone.rate)} · {zone.etaMinDays}–{zone.etaMaxDays} days
            </p>
          </div>
          <Badge tone={zone.isActive ? "green" : "gray"}>{zone.isActive ? "Active" : "Inactive"}</Badge>
        </div>
        <div className="mt-3 flex gap-3 text-sm font-medium">
          <button type="button" onClick={() => setEditing(true)} className="text-forest-800 hover:underline">
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete zone "${zone.name}"?`)) return;
              start(async () => {
                const res = await deleteShippingZone(zone.id);
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
      <Fields z={zone} state={state} />
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
