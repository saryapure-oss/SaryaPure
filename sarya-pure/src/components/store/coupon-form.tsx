"use client";
import { useActionState } from "react";
import { Tag, X } from "lucide-react";
import { applyCoupon, removeCoupon } from "@/app/actions/cart";
import { initialActionState } from "@/lib/validation/common";
import { SubmitButton } from "@/components/ui/submit-button";
import { useTransition } from "react";
import { useToast } from "./toast";

export function CouponForm({ couponCode, couponApplied, couponError }: { couponCode: string | null; couponApplied: boolean; couponError: string | null }) {
  const [state, action] = useActionState(applyCoupon, initialActionState);
  const [pending, start] = useTransition();
  const toast = useToast();

  if (couponCode && couponApplied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-forest-700/30 bg-forest-50 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-forest-800">
          <Tag className="h-4 w-4" /> {couponCode} applied
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await removeCoupon();
              toast(res.message, "info");
            })
          }
          className="text-forest-700 hover:text-forest-900"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="coupon" className="text-sm font-semibold">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <input id="coupon" name="code" placeholder="Enter code" className="h-11 flex-1 rounded-lg border border-beige-400 bg-white px-3 uppercase placeholder:normal-case focus:border-forest-700 focus:outline-none" maxLength={30} />
        <SubmitButton variant="secondary" size="md" pendingText="Applying…">
          Apply
        </SubmitButton>
      </div>
      {(state.message || couponError) && <p className={`text-sm ${state.ok ? "text-forest-700" : "text-red-700"}`}>{state.message || couponError}</p>}
    </form>
  );
}
