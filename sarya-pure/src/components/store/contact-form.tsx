"use client";
import { useActionState } from "react";
import { submitContact } from "@/app/actions/public";
import { Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";

export function ContactForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(submitContact, initialActionState);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="name" required maxLength={100} error={state.fieldErrors?.name} />
        <Input label="Email address" name="email" type="email" required maxLength={254} autoComplete="email" error={state.fieldErrors?.email} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Phone number (optional)" name="phone" type="tel" maxLength={20} error={state.fieldErrors?.phone} />
        <Input label="Subject" name="subject" required maxLength={150} error={state.fieldErrors?.subject} />
      </div>
      <Textarea label="Message" name="message" required maxLength={3000} rows={6} error={state.fieldErrors?.message} />
      {/* Honeypot — hidden from real users, left blank; bots that fill it are rejected server-side */}
      <div aria-hidden className="hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pendingText="Sending…">Send message</SubmitButton>
    </form>
  );
}
