import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { allowedNextStatuses } from "@/lib/services/orders";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/components/store/order-status-badge";
import { OrderTimeline } from "@/components/store/order-timeline";
import { CancelOrderButton } from "@/components/store/cancel-order-button";
import { SmartImage } from "@/components/ui/smart-image";
import { RetryPayment } from "@/components/store/retry-payment";

export default async function OrderDetailPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { items: true, history: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();

  const cancellable = allowedNextStatuses(order.status).includes("CANCELLED") && !["DELIVERED", "CANCELLED"].includes(order.status) && !order.status.startsWith("REFUND");
  const needsPayment = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID" && order.status === "PENDING";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl">Order {order.orderNumber}</h2>
          <p className="text-muted">Placed on {formatDate(order.createdAt, true)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(order.status)}>{order.status.replace(/_/g, " ")}</Badge>
          <a href={`/account/orders/${order.orderNumber}/invoice`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-forest-800 underline">
            Download invoice
          </a>
        </div>
      </div>

      {needsPayment && (
        <div className="rounded-xl border border-brown-500/30 bg-beige-200/50 p-4">
          <p className="text-sm">Payment for this order is incomplete.</p>
          <div className="mt-3">
            <RetryPayment orderNumber={order.orderNumber} />
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-lg font-semibold">Order tracking</h3>
        <div className="mt-4">
          <OrderTimeline status={order.status} history={order.history.map((h) => ({ status: h.status, createdAt: h.createdAt.toISOString() }))} />
        </div>
        {order.trackingNumber && (
          <p className="mt-2 text-sm text-muted">
            Courier: {order.courierName ?? "—"} · Tracking number: <span className="font-medium text-ink">{order.trackingNumber}</span>
          </p>
        )}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold">Items</h3>
        <ul className="mt-3 divide-y divide-beige-300">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                {i.image && <SmartImage src={i.image} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.productName}</p>
                <p className="text-sm text-muted">
                  {i.variantName} × {i.quantity}
                </p>
              </div>
              <span className="font-semibold">{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-beige-300 pt-4 text-sm">
          <Row label="Subtotal" value={formatINR(order.subtotal)} />
          {order.discount > 0 && <Row label="Discount" value={`− ${formatINR(order.discount)}`} />}
          <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatINR(order.shipping)} />
          {order.codFee > 0 && <Row label="COD fee" value={formatINR(order.codFee)} />}
          <Row label="Tax (GST)" value={`${formatINR(order.tax)} (incl.)`} />
          <div className="flex justify-between border-t border-beige-300 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatINR(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold">Shipping address</h3>
        <p className="mt-2 text-sm leading-6 text-ink">
          {order.customerName}
          <br />
          {order.shipLine1}
          {order.shipLine2 ? `, ${order.shipLine2}` : ""}
          {order.shipLandmark ? `, near ${order.shipLandmark}` : ""}
          <br />
          {order.shipCity}, {order.shipState} {order.shipPincode}
          <br />
          Phone: {order.phone}
        </p>
      </div>

      {cancellable && (
        <div className="flex justify-end">
          <CancelOrderButton orderNumber={order.orderNumber} />
        </div>
      )}

      <p className="text-sm text-muted">
        Need help with this order?{" "}
        <Link href="/contact" className="font-semibold text-forest-800 underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
