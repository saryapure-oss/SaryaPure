"use client";
import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [state, action] = useActionState(loginAction, initialActionState);
  const next = useSearchParams().get("next") ?? "";
  return (
    <div>
      <h1 className="text-3xl">Welcome back</h1>
      <p className="mt-1 text-muted">Sign in to your Sarya Pure account.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        <Input label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} error={state.fieldErrors?.email} />
        <div>
          <Input label="Password" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
          <Link href="/forgot-password" className="mt-1.5 inline-block text-sm font-semibold text-forest-800 hover:underline">
            Forgot password?
          </Link>
        </div>
        <FormMessage ok={state.ok} message={state.fieldErrors?._form ?? state.message} />
        <SubmitButton className="w-full" pendingText="Signing in…">
          Sign in
        </SubmitButton>
      </form>
      <p className="mt-6 text-sm text-muted">
        New to Sarya Pure?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-forest-800 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
