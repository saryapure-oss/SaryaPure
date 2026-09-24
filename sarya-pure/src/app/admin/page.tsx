import Link from "next/link";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/components/store/order-status-badge";

export const metadata = { title: "Dashboard" };

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function loadMetrics() {
  const now = new Date();
  const today = startOfDay(now);
  const last30 = new Date(today.getTime() - 30 * 86400000);

  const paidWhere = { paymentStatus: "PAID" as const, status: { notIn: ["CANCELLED", "REFUNDED"] as ("CANCELLED" | "REFUNDED")[] } };

  const [
    totalSalesAgg,
    todaySalesAgg,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    outOfStock,
    newB2B,
    unreadMessages,
    recentOrders,
    dailySales,
    topProducts,
  ] = await Promise.all([
    db.order.aggregate({ where: paidWhere, _sum: { total: true } }),
    db.order.aggregate({ where: { ...paidWhere, createdAt: { gte: today } }, _sum: { total: true } }),
    db.order.count(),
    db.order.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count(),
    db.inventory.count({ where: { stock: { lte: 0 } } }),
    db.b2BEnquiry.count({ where: { status: "NEW" } }),
    db.contactMessage.count({ where: { isRead: false } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { orderNumber: true, customerName: true, total: true, status: true, paymentStatus: true, createdAt: true } }),
    db.order.findMany({
      where: { ...paidWhere, createdAt: { gte: last30 } },
      select: { createdAt: true, total: true },
    }),
    db.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
      where: { order: paidWhere },
    }),
  ]);

  // Low-stock count via raw comparison since Prisma can't compare two columns directly in a filter portably here.
  const lowStockRows = await db.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "Inventory" WHERE "stock" > 0 AND "stock" <= "lowStockThreshold"`;
  const lowStockCount = Number(lowStockRows[0]?.count ?? 0n);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of dailySales) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + o.total);
  }
  const chart = [...byDay.entries()].reverse();

  return {
    totalSales: totalSalesAgg._sum?.total ?? 0,
    todaySales: todaySalesAgg._sum?.total ?? 0,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalProducts,
    lowStockCount,
    outOfStock,
    newB2B,
    unreadMessages,
    recentOrders,
    chart,
    topProducts,
  };
}

function MetricCard({ label, value, href, tone }: { label: string; value: string; href?: string; tone?: "warn" }) {
  const inner = (
    <div className={`rounded-2xl border p-4 ${tone === "warn" ? "border-red-200 bg-red-50" : "border-beige-300 bg-white"}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${tone === "warn" ? "text-red-800" : "text-forest-900"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function AdminDashboardPage() {
  const m = await loadMetrics();
  const maxDay = Math.max(1, ...m.chart.map(([, v]) => v));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">An overview of sales, orders and store health.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard label="Total sales (paid)" value={formatINR(m.totalSales)} />
        <MetricCard label="Today's sales" value={formatINR(m.todaySales)} />
        <MetricCard label="Total orders" value={String(m.totalOrders)} href="/admin/orders" />
        <MetricCard label="Pending orders" value={String(m.pendingOrders)} href="/admin/orders?status=PENDING" tone={m.pendingOrders > 0 ? "warn" : undefined} />
        <MetricCard label="Customers" value={String(m.totalCustomers)} href="/admin/customers" />
        <MetricCard label="Products" value={String(m.totalProducts)} href="/admin/products" />
        <MetricCard label="Low stock" value={String(m.lowStockCount)} href="/admin/inventory?filter=low" tone={m.lowStockCount > 0 ? "warn" : undefined} />
        <MetricCard label="Out of stock" value={String(m.outOfStock)} href="/admin/inventory?filter=out" tone={m.outOfStock > 0 ? "warn" : undefined} />
        <MetricCard label="New B2B enquiries" value={String(m.newB2B)} href="/admin/b2b" tone={m.newB2B > 0 ? "warn" : undefined} />
        <MetricCard label="Unread messages" value={String(m.unreadMessages)} href="/admin/messages" tone={m.unreadMessages > 0 ? "warn" : undefined} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-beige-300 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Sales — last 14 days</h2>
          <div className="mt-4 flex h-40 items-end gap-1.5">
            {m.chart.map(([day, value]) => (
              <div key={day} className="flex flex-1 flex-col items-center gap-1" title={`${day}: ${formatINR(value)}`}>
                <div className="w-full rounded-t bg-forest-700" style={{ height: `${Math.max(4, (value / maxDay) * 128)}px` }} />
                <span className="text-[10px] text-muted">{day.slice(8, 10)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-beige-300 bg-white p-5">
          <h2 className="font-semibold">Top products (30d)</h2>
          <ul className="mt-3 space-y-2.5 text-sm">
            {m.topProducts.length === 0 && <li className="text-muted">No paid orders yet.</li>}
            {m.topProducts.map((p) => (
              <li key={p.productName} className="flex items-center justify-between gap-2">
                <span className="truncate">{p.productName}</span>
                <span className="shrink-0 text-muted">{p._sum?.quantity ?? 0} sold</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-beige-300 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-forest-800 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {m.recentOrders.map((o) => (
                <tr key={o.orderNumber} className="border-b border-beige-200 last:border-0">
                  <td className="py-2.5 pr-4">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-semibold text-forest-800 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">{o.customerName}</td>
                  <td className="py-2.5 pr-4">{formatINR(o.total)}</td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={o.paymentStatus === "PAID" ? "green" : o.paymentStatus === "FAILED" ? "red" : "gray"}>{o.paymentStatus}</Badge>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge tone={statusTone(o.status)}>{o.status.replaceAll("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
              {m.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
