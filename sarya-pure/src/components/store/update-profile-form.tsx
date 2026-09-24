"use client";
import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export function UpdateProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState(updateProfileAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <Input label="Full name" name="name" defaultValue={name} required error={state.fieldErrors?.name} />
      <Input label="Email address" name="email" defaultValue={email} disabled hint="Contact support to change your email." />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
