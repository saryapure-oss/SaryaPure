"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleCouponActive, deleteCoupon } from "@/app/actions/admin/coupons";
import { useToast } from "@/components/store/toast";

export function CouponToggle({ couponId, isActive }: { couponId: string; isActive: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleCouponActive(couponId);
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        })
      }
      className="text-sm font-medium text-forest-800 hover:underline disabled:opacity-50"
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

export function DeleteCouponButton({ couponId, code }: { couponId: string; code: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete coupon "${code}"?`)) return;
        start(async () => {
          const res = await deleteCoupon(couponId);
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        });
      }}
      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
