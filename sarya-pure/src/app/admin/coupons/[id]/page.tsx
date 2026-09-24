import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "Edit coupon" };

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [coupon, products, categories] = await Promise.all([
    db.coupon.findUnique({ where: { id }, include: { products: { select: { id: true, name: true } }, categories: { select: { id: true, name: true } } } }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!coupon) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold text-forest-900">{coupon.code}</h1>
      <CouponForm coupon={coupon} products={products} categories={categories} />
    </div>
  );
}
