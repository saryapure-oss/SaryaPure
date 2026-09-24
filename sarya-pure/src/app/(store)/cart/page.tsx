import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { getCartView } from "@/lib/services/cart";
import { getCurrentUser } from "@/lib/auth/session";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartLine } from "@/components/store/cart-line";
import { CouponForm } from "@/components/store/coupon-form";
import { OrderSummary } from "@/components/store/order-summary";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default async function CartPage() {
  const [cart, user] = await Promise.all([getCartView(), getCurrentUser()]);

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: "Cart" }]} />
        <div className="mt-8">
          <EmptyState title="Your cart is empty" text="Looks like you haven't added anything yet. Explore our premium dry fruits and gift hampers." cta={{ href: "/shop", label: "Start shopping" }} icon={<ShoppingBag className="h-10 w-10" />} />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Cart" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Your Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <ul>
            {cart.lines.map((line) => (
              <CartLine key={line.itemId} line={line} isLoggedIn={Boolean(user)} />
            ))}
          </ul>
          <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-forest-800 hover:underline">
            ← Continue shopping
          </Link>
        </div>
        <aside className="card h-fit space-y-6 p-6">
          <CouponForm couponCode={cart.couponCode} couponApplied={cart.pricing.couponApplied} couponError={cart.pricing.couponError} />
          <OrderSummary pricing={cart.pricing} freeShippingRemaining={cart.pricing.freeShippingRemaining} />
          {cart.hasProblems ? (
            <>
              <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-beige-300 px-6 py-3 text-sm font-semibold text-muted">
                Resolve cart issues to continue
              </button>
              <p className="text-sm text-red-700">Please remove or adjust the highlighted items before checking out.</p>
            </>
          ) : (
            <ButtonLink href="/checkout" size="lg" className="w-full">
              Proceed to Checkout
            </ButtonLink>
          )}
          <p className="text-center text-xs text-muted">Secure checkout · Prices inclusive of GST</p>
        </aside>
      </div>
    </div>
  );
}
