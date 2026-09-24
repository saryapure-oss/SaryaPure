"use client";
import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialActionState);
  return (
    <form action={action} className="space-y-4">
      <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" required error={state.fieldErrors?.currentPassword} />
      <Input label="New password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} error={state.fieldErrors?.newPassword} />
      <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
