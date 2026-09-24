import Link from "next/link";
import { Package, Heart, MapPin, ShieldCheck, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/components/store/order-status-badge";

export default async function AccountDashboard() {
  const user = await requireUser("/account");
  const [orderCount, wishlistCount, addressCount, recentOrders] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
    db.address.count({ where: { userId: user.id } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl">Welcome back, {user.name.split(" ")[0]}</h2>
        <p className="text-muted">{user.email}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Package} label="Orders" value={orderCount} href="/account/orders" />
        <Stat icon={Heart} label="Wishlist" value={wishlistCount} href="/wishlist" />
        <Stat icon={MapPin} label="Saved addresses" value={addressCount} href="/account/addresses" />
      </div>
      {!user.emailVerified && (
        <div className="flex items-center gap-3 rounded-xl border border-gold-400/50 bg-gold-300/15 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brown-700" aria-hidden />
          <p className="text-sm text-brown-700">
            Your email isn&apos;t verified yet.{" "}
            <Link href="/account/security" className="font-semibold underline">
              Verify now
            </Link>
          </p>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Recent orders</h3>
          <Link href="/account/orders" className="text-sm font-semibold text-forest-800 hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="mt-3 text-muted">You haven&apos;t placed any orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-beige-300 rounded-xl border border-beige-300 bg-cream-50">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.orderNumber}`} className="flex items-center justify-between gap-3 p-4 hover:bg-beige-100">
                  <div>
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="text-sm text-muted">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone(o.status)}>{o.status.replace(/_/g, " ")}</Badge>
                    <span className="font-semibold">{formatINR(o.total)}</span>
                    <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, href }: { icon: typeof Package; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-forest-50 text-forest-800">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block text-2xl font-semibold text-forest-900">{value}</span>
        <span className="block text-sm text-muted">{label}</span>
      </span>
    </Link>
  );
}
