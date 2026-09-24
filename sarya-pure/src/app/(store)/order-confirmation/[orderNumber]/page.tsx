import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { RetryPayment } from "@/components/store/retry-payment";

export const metadata: Metadata = { title: "Order Confirmed", robots: { index: false } };

export default async function OrderConfirmationPage({ params }: PageProps<"/order-confirmation/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/order-confirmation/${orderNumber}`);
  const order = await db.order.findFirst({ where: { orderNumber, userId: user.id }, include: { items: true } });
  if (!order) notFound();

  const needsPayment = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID" && order.status === "PENDING";

  return (
    <div className="container-page max-w-2xl py-14 text-center">
      {needsPayment ? (
        <Clock className="mx-auto h-14 w-14 text-brown-600" aria-hidden />
      ) : (
        <CheckCircle2 className="mx-auto h-14 w-14 text-forest-700" aria-hidden />
      )}
      <h1 className="mt-5 text-4xl">{needsPayment ? "Payment pending" : "Thank you for your order!"}</h1>
      <p className="mt-2 text-muted">
        Order <span className="font-semibold text-ink">{order.orderNumber}</span> placed on {formatDate(order.createdAt)}
      </p>

      {needsPayment && (
        <div className="mt-6 rounded-xl border border-brown-500/30 bg-beige-200/50 p-5">
          <p className="text-sm">Your payment was not completed. You can retry now, or from My Orders at any time.</p>
          <div className="mt-4">
            <RetryPayment orderNumber={order.orderNumber} />
          </div>
        </div>
      )}

      <div className="card mt-8 p-6 text-left">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <ul className="mt-3 divide-y divide-beige-300">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2.5 text-sm">
              <span>
                {i.productName} ({i.variantName}) × {i.quantity}
              </span>
              <span className="font-medium">{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-beige-300 pt-3 font-semibold">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
        <p className="mt-2 text-sm text-muted">Payment method: {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online payment"}</p>
        {order.estimatedDelivery && <p className="text-sm text-muted">Estimated delivery: {order.estimatedDelivery}</p>}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/account/orders/${order.orderNumber}`}>Track this order</ButtonLink>
        <ButtonLink href="/shop" variant="secondary">
          Continue shopping
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-muted">
        Need help?{" "}
        <Link href="/contact" className="font-semibold text-forest-800 underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
