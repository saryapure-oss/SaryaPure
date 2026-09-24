"use client";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/app/actions/public";
import { initialActionState } from "@/lib/validation/common";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, action] = useActionState(subscribeNewsletter, initialActionState);
  const input =
    tone === "dark"
      ? "h-12 w-full rounded-full border border-white/20 bg-white/5 px-5 text-cream-50 placeholder:text-cream-100/60 focus:border-gold-400 focus:outline-none"
      : "h-12 w-full rounded-full border border-beige-400 bg-white px-5 focus:border-forest-700 focus:outline-none";
  return (
    <form action={action} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
        <label className="sr-only" htmlFor="nl-name">
          Name
        </label>
        <input id="nl-name" name="name" placeholder="Your name" className={input} autoComplete="name" maxLength={80} />
        <label className="sr-only" htmlFor="nl-email">
          Email
        </label>
        <input id="nl-email" name="email" type="email" required placeholder="Email address" className={input} autoComplete="email" maxLength={254} />
        <SubmitButton variant="gold" className="h-12" pendingText="Joining…">
          Subscribe
        </SubmitButton>
      </div>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? (tone === "dark" ? "text-gold-300" : "text-forest-700") : "text-red-300"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
