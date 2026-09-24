"use client";
import { useActionState } from "react";
import { submitB2BEnquiry } from "@/app/actions/public";
import { Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";

const BUSINESS_TYPES = ["Retailer", "Wholesaler", "Distributor", "Hotel / Restaurant / Café", "Corporate gifting", "Event / Caterer", "Other"];

export function B2BForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitB2BEnquiry, initialActionState);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="name" required maxLength={100} error={state.fieldErrors?.name} />
        <Input label="Company name" name="company" maxLength={150} error={state.fieldErrors?.company} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Business type" name="businessType" options={BUSINESS_TYPES} placeholder="Select business type" error={state.fieldErrors?.businessType} />
        <Input label="City" name="city" required maxLength={80} error={state.fieldErrors?.city} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Mobile number" name="phone" type="tel" required maxLength={20} error={state.fieldErrors?.phone} />
        <Input label="Email address" name="email" type="email" required maxLength={254} autoComplete="email" error={state.fieldErrors?.email} />
      </div>
      <Textarea label="What products do you need?" name="productRequirement" required maxLength={1000} rows={4} error={state.fieldErrors?.productRequirement} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Estimated quantity" name="estimatedQuantity" required maxLength={200} placeholder="e.g. 100 kg / month" error={state.fieldErrors?.estimatedQuantity} />
        <Input label="Budget (optional)" name="budget" maxLength={100} error={state.fieldErrors?.budget} />
      </div>
      <Textarea label="Additional message (optional)" name="message" maxLength={3000} rows={3} error={state.fieldErrors?.message} />
      <div aria-hidden className="hidden">
        <label htmlFor="b2b-website">Website</label>
        <input id="b2b-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Submitting…">Submit enquiry</SubmitButton>
    </form>
  );
}
