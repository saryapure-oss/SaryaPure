"use client";
import { useActionState } from "react";
import Link from "next/link";
import { trackOrderPublic } from "@/app/actions/customer-orders";
import { initialActionState } from "@/lib/validation/common";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function TrackOrderPage() {
  const [state, action] = useActionState(trackOrderPublic, initialActionState);
  const orderNumber = state.data?.orderNumber as string | undefined;

  return (
    <div className="container-page max-w-lg py-8">
      <Breadcrumbs items={[{ label: "Track Order" }]} />
      <h1 className="mt-4 text-4xl">Track Your Order</h1>
      <p className="mt-2 text-muted">Enter your order number and the email used to place the order.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        <Input label="Order number" name="orderNumber" required placeholder="SP240923ABCDE" />
        <Input label="Email address" name="email" type="email" required maxLength={254} />
        <FormMessage ok={state.ok || Boolean(orderNumber)} message={orderNumber ? undefined : state.message} />
        <SubmitButton className="w-full" pendingText="Searching…">
          Track order
        </SubmitButton>
      </form>
      {orderNumber && (
        <div className="mt-6 rounded-xl border border-forest-700/30 bg-forest-50 p-4 text-center">
          <p className="text-sm">We found your order.</p>
          <Link href={`/login?next=${encodeURIComponent(`/account/orders/${orderNumber}`)}`} className="mt-2 inline-block font-semibold text-forest-800 underline">
            Sign in to view full tracking →
          </Link>
        </div>
      )}
    </div>
  );
}
