"use client";
import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialActionState);
  const next = useSearchParams().get("next") ?? "";
  return (
    <div>
      <h1 className="text-3xl">Create your account</h1>
      <p className="mt-1 text-muted">Join Sarya Pure for faster checkout and order tracking.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Input label="Full name" name="name" autoComplete="name" required maxLength={100} error={state.fieldErrors?.name} />
        <Input label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} error={state.fieldErrors?.email} />
        <Input label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} error={state.fieldErrors?.password} hint="At least 8 characters, with letters and numbers." />
        <Input label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
        <FormMessage ok={state.ok} message={state.message} />
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
        <p className="text-xs leading-5 text-muted">
          By creating an account you agree to our{" "}
          <Link href="/policies/terms-and-conditions" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/policies/privacy-policy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-forest-800 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
