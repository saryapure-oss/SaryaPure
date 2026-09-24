import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getCartView } from "@/lib/services/cart";
import { db } from "@/lib/db";
import { getSettings, isRazorpayConfigured } from "@/lib/settings";
import { quoteShipping } from "@/lib/services/shipping";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutForm } from "@/components/store/checkout-form";
import { OrderSummary } from "@/components/store/order-summary";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [cart, addresses, settings] = await Promise.all([
    getCartView(),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    getSettings(),
  ]);

  if (cart.lines.length === 0) redirect("/cart");
  if (cart.hasProblems) redirect("/cart");

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const shipping = defaultAddr ? await quoteShipping(defaultAddr.pincode, settings.commerce) : null;
  const razorpayEnabled = settings.payment.razorpayEnabled && isRazorpayConfigured();

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Checkout</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <CheckoutForm
          savedAddresses={addresses.map((a) => ({ id: a.id, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", landmark: a.landmark ?? "", city: a.city, state: a.state, pincode: a.pincode, isDefault: a.isDefault }))}
          codAvailable={shipping?.codAvailable ?? settings.commerce.codEnabled}
          razorpayEnabled={razorpayEnabled}
          total={cart.pricing.total}
        />
        <aside className="card h-fit space-y-6 p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="max-h-64 space-y-3 overflow-y-auto text-sm">
            {cart.lines.map((l) => (
              <li key={l.itemId} className="flex justify-between gap-3">
                <span className="text-muted">
                  {l.productName} ({l.variantName}) × {l.quantity}
                </span>
                <span className="shrink-0 font-medium">{(l.lineSubtotal / 100).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</span>
              </li>
            ))}
          </ul>
          <OrderSummary pricing={cart.pricing} freeShippingRemaining={cart.pricing.freeShippingRemaining} showCodFee />
        </aside>
      </div>
    </div>
  );
}
