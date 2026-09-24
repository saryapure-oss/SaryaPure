import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/components/store/order-status-badge";
import { allowedNextStatuses } from "@/lib/services/orders";
import { OrderStatusForm, RefundForm, AdminNoteForm, CancelOrderButton } from "@/components/admin/order-actions";

export const metadata = { title: "Order detail" };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, email: true, createdAt: true } },
      coupon: { select: { code: true } },
    },
  });
  if (!order) notFound();

  const nextStatuses = allowedNextStatuses(order.status);
  const payment = order.payments[0];
  const refundable = payment ? payment.amount - payment.refundedAmount : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt.toISOString(), true)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={order.paymentStatus === "PAID" ? "green" : order.paymentStatus === "FAILED" ? "red" : "gray"}>{order.paymentStatus}</Badge>
          <Badge tone={statusTone(order.status)}>{order.status.replaceAll("_", " ")}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-beige-300 bg-white p-5">
            <h2 className="font-semibold">Items</h2>
            <table className="mt-3 w-full text-left text-sm">
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id} className="border-b border-beige-200 last:border-0">
                    <td className="py-2.5 pr-3">
                      {i.productName}
                      <p className="text-xs text-muted">
                        {i.variantName} · {i.sku} · Qty {i.quantity}
                      </p>
                    </td>
                    <td className="py-2.5 text-right">{formatINR(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`− ${formatINR(order.discount)}`} />}
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatINR(order.shipping)} />
              {order.codFee > 0 && <Row label="COD fee" value={formatINR(order.codFee)} />}
              <Row label="Tax" value={formatINR(order.tax)} />
              <div className="flex justify-between border-t border-beige-300 pt-2 font-semibold text-forest-900">
                <dt>Total</dt>
                <dd>{formatINR(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-beige-300 bg-white p-5">
            <h2 className="font-semibold">Status history</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 border-b border-beige-200 pb-2 last:border-0">
                  <span>
                    <Badge tone={statusTone(h.status)}>{h.status.replaceAll("_", " ")}</Badge>
                    {h.note && <span className="ml-2 text-muted">{h.note}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{formatDate(h.createdAt.toISOString(), true)}</span>
                </li>
              ))}
            </ul>
          </section>

          {nextStatuses.length > 0 && (
            <section className="rounded-2xl border border-beige-300 bg-white p-5">
              <h2 className="font-semibold">Update status</h2>
              <OrderStatusForm orderId={order.id} nextStatuses={nextStatuses} trackingNumber={order.trackingNumber} courierName={order.courierName} />
            </section>
          )}

          {payment?.status === "PAID" && refundable > 0 && (
            <section className="rounded-2xl border border-beige-300 bg-white p-5">
              <h2 className="font-semibold">Refund</h2>
              <p className="mt-1 text-sm text-muted">Up to {formatINR(refundable)} refundable.</p>
              <RefundForm orderId={order.id} maxAmount={refundable} />
            </section>
          )}

          <section className="rounded-2xl border border-beige-300 bg-white p-5">
            <h2 className="font-semibold">Admin note</h2>
            <AdminNoteForm orderId={order.id} note={order.adminNote ?? ""} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-beige-300 bg-white p-5 text-sm">
            <h2 className="font-semibold">Customer</h2>
            <p className="mt-2">{order.customerName}</p>
            <p className="text-muted">{order.email}</p>
            <p className="text-muted">{order.phone}</p>
            {order.user && (
              <Link href="/admin/customers" className="mt-2 inline-block text-forest-800 hover:underline">
                View customer →
              </Link>
            )}
          </section>

          <section className="rounded-2xl border border-beige-300 bg-white p-5 text-sm">
            <h2 className="font-semibold">Shipping address</h2>
            <p className="mt-2">{order.shipLine1}</p>
            {order.shipLine2 && <p>{order.shipLine2}</p>}
            {order.shipLandmark && <p>{order.shipLandmark}</p>}
            <p>
              {order.shipCity}, {order.shipState} {order.shipPincode}
            </p>
            <p>{order.shipCountry}</p>
            {order.trackingNumber && (
              <p className="mt-2 text-muted">
                Tracking: {order.trackingNumber} {order.courierName && `(${order.courierName})`}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-beige-300 bg-white p-5 text-sm">
            <h2 className="font-semibold">Payment</h2>
            <p className="mt-2">{order.paymentMethod}</p>
            {payment && (
              <>
                <p className="text-muted">Amount: {formatINR(payment.amount)}</p>
                {payment.refundedAmount > 0 && <p className="text-muted">Refunded: {formatINR(payment.refundedAmount)}</p>}
                {payment.providerPaymentId && <p className="text-muted break-all">Ref: {payment.providerPaymentId}</p>}
              </>
            )}
          </section>

          {["PENDING", "CONFIRMED", "PROCESSING", "PACKED"].includes(order.status) && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm">
              <h2 className="font-semibold text-red-800">Cancel order</h2>
              <CancelOrderButton orderId={order.id} />
            </section>
          )}
        </div>
      </div>
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
