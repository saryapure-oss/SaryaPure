import { db } from "@/lib/db";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "New coupon" };

export default async function NewCouponPage() {
  const [products, categories] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-forest-900">New coupon</h1>
      <CouponForm products={products} categories={categories} />
    </div>
  );
}
