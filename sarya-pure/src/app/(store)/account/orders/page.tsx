import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { statusTone } from "@/components/store/order-status-badge";

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: { take: 1 } } });

  if (orders.length === 0) {
    return <EmptyState title="No orders yet" text="When you place an order, it will show up here." cta={{ href: "/shop", label: "Start shopping" }} icon={<Package className="h-10 w-10" />} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl">Your Orders</h2>
      <ul className="divide-y divide-beige-300 rounded-xl border border-beige-300 bg-cream-50">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-beige-100">
              <div>
                <p className="font-semibold">{o.orderNumber}</p>
                <p className="text-sm text-muted">
                  {formatDate(o.createdAt)} · {o.items[0]?.productName}
                  {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={statusTone(o.status)}>{o.status.replace(/_/g, " ")}</Badge>
                <span className="font-semibold">{formatINR(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
