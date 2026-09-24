"use client";
import { useActionState } from "react";
import { Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { INDIAN_STATES } from "@/lib/validation/common";
import type { ActionState } from "@/lib/validation/common";

export function AddressForm({
  action,
  defaults,
  onDone,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  defaults?: { fullName?: string; phone?: string; line1?: string; line2?: string; landmark?: string; city?: string; state?: string; pincode?: string };
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(action, { ok: false } as ActionState);
  if (state.ok && onDone) onDone();
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" name="fullName" required defaultValue={defaults?.fullName} error={state.fieldErrors?.fullName} className="sm:col-span-2" />
      <Input label="Mobile number" name="phone" type="tel" required defaultValue={defaults?.phone} error={state.fieldErrors?.phone} />
      <div />
      <Input label="Address line" name="line1" required defaultValue={defaults?.line1} error={state.fieldErrors?.line1} className="sm:col-span-2" />
      <Input label="Apartment / building (optional)" name="line2" defaultValue={defaults?.line2} error={state.fieldErrors?.line2} />
      <Input label="Landmark (optional)" name="landmark" defaultValue={defaults?.landmark} error={state.fieldErrors?.landmark} />
      <Input label="City" name="city" required defaultValue={defaults?.city} error={state.fieldErrors?.city} />
      <Select label="State" name="state" required defaultValue={defaults?.state ?? ""} placeholder="Select state" options={INDIAN_STATES} error={state.fieldErrors?.state} />
      <Input label="PIN code" name="pincode" required inputMode="numeric" defaultValue={defaults?.pincode} error={state.fieldErrors?.pincode} />
      <div className="sm:col-span-2">
        <FormMessage ok={state.ok} message={state.message} className="mb-3" />
        <SubmitButton pendingText="Saving…">Save address</SubmitButton>
      </div>
    </form>
  );
}
