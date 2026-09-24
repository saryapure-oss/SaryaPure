import type { Metadata } from "next";
import { Suspense } from "react";
import { parseFilters } from "@/lib/services/catalog";
import { CatalogView } from "@/components/store/catalog-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CatalogSkeleton } from "@/components/store/skeletons";
import { track } from "@/lib/services/analytics";
import { controlClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const filters = parseFilters(await searchParams);
  if (filters.q && (filters.page ?? 1) === 1) await track("search", { meta: { q: filters.q.slice(0, 60) } });
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Search" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">{filters.q ? `Results for “${filters.q}”` : "Search products"}</h1>
      <form action="/search" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="search-q" className="sr-only">
          Search products
        </label>
        <input id="search-q" name="q" type="search" defaultValue={filters.q} placeholder="Search by name, category or SKU" className={controlClass} maxLength={80} />
        <Button type="submit">Search</Button>
      </form>
      <div className="mt-8">
        <Suspense key={JSON.stringify(filters)} fallback={<CatalogSkeleton />}>
          <CatalogView filters={filters} basePath="/search" />
        </Suspense>
      </div>
    </div>
  );
}
