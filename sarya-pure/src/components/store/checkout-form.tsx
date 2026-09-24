"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { placeOrderAction, verifyPaymentAction, reportPaymentFailureAction, type PlaceOrderState } from "@/app/actions/checkout";
import { initialActionState, INDIAN_STATES } from "@/lib/validation/common";
import { Input, Select, Checkbox, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useToast } from "./toast";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (evt: string, cb: (r: { error: { description?: string } }) => void) => void };
  }
}

type Address = { fullName: string; phone: string; line1: string; line2: string; landmark: string; city: string; state: string; pincode: string };

export function CheckoutForm({
  savedAddresses,
  codAvailable,
  razorpayEnabled,
  total,
}: {
  savedAddresses: (Address & { id: string; isDefault: boolean })[];
  codAvailable: boolean;
  razorpayEnabled: boolean;
  total: number;
}) {
  const initial: PlaceOrderState = { ...initialActionState };
  const [state, action] = useActionState(placeOrderAction, initial);
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(razorpayEnabled ? "RAZORPAY" : "COD");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(savedAddresses.find((a) => a.isDefault)?.id ?? (savedAddresses[0]?.id ?? "new"));
  const [processing, setProcessing] = useState(false);
  // NOTE: useId() is NOT safe here — it's deterministic based on component tree
  // position for SSR/client hydration matching, not a random unique token, so it
  // can produce the same value across different page loads/sessions and collide
  // with another order's idempotency key. Generate a real random token once per
  // mount instead.
  const [idempotencyKey] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const router = useRouter();
  const toast = useToast();

  const selected = useMemo(() => savedAddresses.find((a) => a.id === selectedAddressId), [savedAddresses, selectedAddressId]);

  useEffect(() => {
    if (!state.razorpay) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reflects an external event (server action returned a Razorpay order); no cascading render loop.
    setProcessing(true);
    const rz = state.razorpay;
    const open = () => {
      if (!window.Razorpay) {
        toast("Payment could not load. Please check your connection and try again.", "error");
        setProcessing(false);
        return;
      }
      const instance = new window.Razorpay({
        key: rz.keyId,
        amount: rz.amount,
        currency: rz.currency,
        name: rz.name,
        description: `Order ${state.orderNumber}`,
        order_id: rz.orderId,
        prefill: rz.prefill,
        theme: { color: "#1f3d2b" },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const res = await verifyPaymentAction(resp);
          setProcessing(false);
          if (res.ok && res.orderNumber) router.push(`/order-confirmation/${res.orderNumber}`);
          else {
            toast(res.message, "error");
            if (res.orderNumber) router.push(`/order-confirmation/${res.orderNumber}`);
          }
        },
        modal: {
          ondismiss: async () => {
            setProcessing(false);
            await reportPaymentFailureAction(rz.orderId, "Payment cancelled by customer");
            toast("Payment was not completed. Your order is saved — you can retry from My Orders.", "info");
          },
        },
      });
      instance.on("payment.failed", async (r) => {
        setProcessing(false);
        await reportPaymentFailureAction(rz.orderId, r.error?.description ?? "Payment failed");
        toast("Payment failed. Please try again or choose a different method.", "error");
      });
      instance.open();
    };
    if (window.Razorpay) open();
    else {
      const t = setInterval(() => {
        if (window.Razorpay) {
          clearInterval(t);
          open();
        }
      }, 200);
      setTimeout(() => clearInterval(t), 8000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.razorpay]);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <form action={action} className="space-y-8">
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        <section>
          <h2 className="text-xl font-semibold">Delivery address</h2>
          {savedAddresses.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {savedAddresses.map((a) => (
                <label key={a.id} className={cn("cursor-pointer rounded-xl border p-3 text-sm", selectedAddressId === a.id ? "border-forest-800 bg-forest-50" : "border-beige-400")}>
                  <input type="radio" name="_addressPick" className="sr-only" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} />
                  <span className="block font-semibold">{a.fullName}</span>
                  <span className="block text-muted">
                    {a.line1}, {a.city}, {a.state} {a.pincode}
                  </span>
                </label>
              ))}
              <label className={cn("cursor-pointer rounded-xl border p-3 text-sm", selectedAddressId === "new" ? "border-forest-800 bg-forest-50" : "border-beige-400")}>
                <input type="radio" name="_addressPick" className="sr-only" checked={selectedAddressId === "new"} onChange={() => setSelectedAddressId("new")} />
                <span className="font-semibold">+ Use a new address</span>
              </label>
            </div>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="fullName" required defaultValue={selected?.fullName} error={state.fieldErrors?.fullName} className="sm:col-span-2" />
            <Input label="Mobile number" name="phone" type="tel" required defaultValue={selected?.phone} error={state.fieldErrors?.phone} inputMode="numeric" />
            <div />
            <Input label="Address line" name="line1" required defaultValue={selected?.line1} error={state.fieldErrors?.line1} className="sm:col-span-2" />
            <Input label="Apartment / building (optional)" name="line2" defaultValue={selected?.line2} error={state.fieldErrors?.line2} />
            <Input label="Landmark (optional)" name="landmark" defaultValue={selected?.landmark} error={state.fieldErrors?.landmark} />
            <Input label="City" name="city" required defaultValue={selected?.city} error={state.fieldErrors?.city} />
            <Select label="State" name="state" required defaultValue={selected?.state ?? ""} placeholder="Select state" options={INDIAN_STATES} error={state.fieldErrors?.state} />
            <Input label="PIN code" name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" defaultValue={selected?.pincode} error={state.fieldErrors?.pincode} hint="We use this to calculate shipping." />
          </div>
          {savedAddresses.length === 0 || selectedAddressId === "new" ? <Checkbox className="mt-3" name="saveAddress" label="Save this address to my account" /> : <input type="hidden" name="saveAddress" value="" />}
        </section>

        <section>
          <h2 className="text-xl font-semibold">Payment method</h2>
          <div className="mt-3 space-y-2">
            {razorpayEnabled && (
              <PaymentOption id="pm-online" value="RAZORPAY" checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} title="Pay online" desc="UPI, cards, net banking and wallets via Razorpay" />
            )}
            <PaymentOption
              id="pm-cod"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              title="Cash on Delivery"
              desc={codAvailable ? "Pay with cash when your order arrives" : "Not available for this address"}
              disabled={!codAvailable}
            />
          </div>
        </section>

        <section>
          <Textarea label="Gift message (optional)" name="giftMessage" maxLength={300} placeholder="Add a note to include with your order" />
          <Textarea label="Order note (optional)" name="customerNote" maxLength={500} placeholder="Any delivery instructions?" className="mt-4" />
        </section>

        <FormMessage ok={state.ok} message={state.fieldErrors?._form ?? state.message} />
        <SubmitButton size="lg" className="w-full" disabled={processing} pendingText="Placing order…">
          {processing ? "Waiting for payment…" : paymentMethod === "COD" ? `Place Order · ${formatINR(total)}` : `Pay ${formatINR(total)}`}
        </SubmitButton>
      </form>
    </>
  );
}

function PaymentOption({ id, value, checked, onChange, title, desc, disabled }: { id: string; value: string; checked: boolean; onChange: () => void; title: string; desc: string; disabled?: boolean }) {
  return (
    <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4", checked ? "border-forest-800 bg-forest-50" : "border-beige-400", disabled && "cursor-not-allowed opacity-50")}>
      <input id={id} type="radio" name="paymentMethod" value={value} checked={checked} onChange={onChange} disabled={disabled} className="mt-1 accent-forest-800" required />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{desc}</span>
      </span>
    </label>
  );
}
