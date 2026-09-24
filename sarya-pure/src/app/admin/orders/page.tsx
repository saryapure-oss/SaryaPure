import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { statusTone } from "@/components/store/order-status-badge";
import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Orders" };

const PAGE_SIZE = 25;
const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUND_INITIATED", "REFUNDED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.order.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Orders</h1>
        <p className="mt-1 text-sm text-muted">{total} order(s) total.</p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input name="q" defaultValue={q} placeholder="Search order #, name, email, phone…" className="h-10 w-72 rounded-lg border border-beige-400 bg-white px-3 text-sm" />
        <select name="status" defaultValue={status} className="h-10 rounded-lg border border-beige-400 bg-white px-3 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50">
          Filter
        </button>
      </form>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" text="Try a different search or filter." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-semibold text-forest-800 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.customerName}
                    <p className="text-xs text-muted">{o.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(o.createdAt.toISOString())}</td>
                  <td className="px-4 py-3">{formatINR(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={o.paymentStatus === "PAID" ? "green" : o.paymentStatus === "FAILED" ? "red" : "gray"}>{o.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(o.status)}>{o.status.replaceAll("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/orders" params={{ q, status }} />
    </div>
  );
}
