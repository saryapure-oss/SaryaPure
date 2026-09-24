import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFilters } from "@/lib/services/catalog";
import { CatalogView } from "@/components/store/catalog-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CatalogSkeleton } from "@/components/store/skeletons";

export const metadata: Metadata = {
  title: "Shop Premium Dry Fruits, Nuts & Seeds",
  description: "Shop premium almonds, cashews, pistachios, walnuts, dates, figs, seeds, mixes and gift hampers from Sarya Pure.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseFilters(await searchParams);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Shop" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Shop All Products</h1>
      <p className="mt-2 max-w-2xl text-muted">Premium dry fruits, nuts, seeds and wholesome snacks — carefully selected and packed.</p>
      <div className="mt-8">
        <Suspense key={JSON.stringify(filters)} fallback={<CatalogSkeleton />}>
          <CatalogView filters={filters} basePath="/shop" />
        </Suspense>
      </div>
    </div>
  );
}
