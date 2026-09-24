"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { retryPaymentAction, verifyPaymentAction, reportPaymentFailureAction } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { useToast } from "./toast";

export function RetryPayment({ orderNumber }: { orderNumber: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await retryPaymentAction(orderNumber);
            if (!res.ok || !res.razorpay) {
              toast(res.message ?? "Could not resume payment.", "error");
              return;
            }
            const rz = res.razorpay;
            if (!window.Razorpay) {
              toast("Payment could not load. Please try again.", "error");
              return;
            }
            const instance = new window.Razorpay({
              key: rz.keyId,
              amount: rz.amount,
              currency: rz.currency,
              name: rz.name,
              order_id: rz.orderId,
              prefill: rz.prefill,
              theme: { color: "#1f3d2b" },
              handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                const v = await verifyPaymentAction(resp);
                if (v.ok) router.push(`/order-confirmation/${orderNumber}`);
                else toast(v.message, "error");
                router.refresh();
              },
              modal: { ondismiss: async () => reportPaymentFailureAction(rz.orderId, "Cancelled on retry") },
            });
            instance.open();
          })
        }
      >
        {pending ? "Loading…" : "Retry payment"}
      </Button>
    </>
  );
}
