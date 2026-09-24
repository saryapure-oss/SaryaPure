import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/lib/money";
import { CouponToggle, DeleteCouponButton } from "@/components/admin/coupon-row-actions";

export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Coupons</h1>
          <p className="mt-1 text-sm text-muted">{coupons.length} coupon(s) total.</p>
        </div>
        <ButtonLink href="/admin/coupons/new">+ New coupon</ButtonLink>
      </div>

      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet" cta={{ href: "/admin/coupons/new", label: "New coupon" }} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-beige-300 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-beige-300 text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-beige-200 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/coupons/${c.id}`} className="font-semibold text-forest-800 hover:underline">
                      {c.code}
                    </Link>
                    {c.description && <p className="text-xs text-muted">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">{c.type === "PERCENTAGE" ? `${c.value}%` : formatINR(c.value)}</td>
                  <td className="px-4 py-3">{c.minOrderAmount ? formatINR(c.minOrderAmount) : "—"}</td>
                  <td className="px-4 py-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3">{c.expiresAt ? c.expiresAt.toLocaleDateString("en-IN") : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={c.isActive ? "green" : "gray"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <CouponToggle couponId={c.id} isActive={c.isActive} />
                      <DeleteCouponButton couponId={c.id} code={c.code} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
