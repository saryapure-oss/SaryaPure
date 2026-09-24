"use client";
import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export default function ForgotPasswordPage() {
  const [state, action] = useActionState(forgotPasswordAction, initialActionState);
  return (
    <div>
      <h1 className="text-3xl">Reset your password</h1>
      <p className="mt-1 text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        <Input label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} />
        <FormMessage ok={state.ok} message={state.message} />
        <SubmitButton className="w-full" pendingText="Sending…">
          Send reset link
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="font-semibold text-forest-800 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
