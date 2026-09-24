"use client";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, initialActionState);
  const token = useSearchParams().get("token") ?? "";
  if (!token) {
    return (
      <div>
        <h1 className="text-3xl">Invalid link</h1>
        <p className="mt-2 text-muted">
          This password reset link is missing its token. Please{" "}
          <Link href="/forgot-password" className="font-semibold text-forest-800 underline">
            request a new one
          </Link>
          .
        </p>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-3xl">Set a new password</h1>
      <form action={action} className="mt-8 space-y-5" noValidate>
        <input type="hidden" name="token" value={token} />
        <Input label="New password" name="password" type="password" autoComplete="new-password" required minLength={8} error={state.fieldErrors?.password} hint="At least 8 characters, with letters and numbers." />
        <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
        <FormMessage ok={state.ok} message={state.message} />
        <SubmitButton className="w-full" pendingText="Saving…">
          Reset password
        </SubmitButton>
      </form>
      {state.ok && (
        <p className="mt-6 text-sm">
          <Link href="/login" className="font-semibold text-forest-800 hover:underline">
            Continue to sign in →
          </Link>
        </p>
      )}
    </div>
  );
}
