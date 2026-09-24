import type { Metadata } from "next";
import { db } from "@/lib/db";
import { cardSelect } from "@/lib/services/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "@/components/store/product-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Gift Hampers",
  description: "Premium dry fruit gift hampers for festivals, corporate gifting, weddings and special occasions.",
  alternates: { canonical: "/gift-hampers" },
};

export default async function GiftHampersPage() {
  const products = await db.product.findMany({
    where: { isPublished: true, giftBox: { isNot: null } },
    select: cardSelect,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Gift Hampers" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Gift Hampers</h1>
      <p className="mt-2 max-w-2xl text-muted">Thoughtfully curated dry fruit hampers — perfect for festivals, weddings, corporate gifting and special occasions.</p>

      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState title="No gift hampers available yet" text="Please check back soon, or contact us for a custom hamper." cta={{ href: "/contact", label: "Contact us" }} />
        )}
      </div>
    </div>
  );
}
