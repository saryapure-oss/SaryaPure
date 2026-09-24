import Link from "next/link";
import { SlidersHorizontal, SearchX } from "lucide-react";
import { getPublishedCategories, getWeightOptions, listProducts, SORTS, type ProductFilters } from "@/lib/services/catalog";
import { ProductGrid } from "./product-card";
import { Pagination } from "@/components/ui/pagination";
import { AutoSubmitSelect } from "./auto-submit-select";
import { controlClass } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

function toParams(f: ProductFilters, lockedCategory?: string): Record<string, string | undefined> {
  return {
    q: f.q,
    category: lockedCategory ? undefined : f.category,
    min: f.minPrice != null ? String(f.minPrice / 100) : undefined,
    max: f.maxPrice != null ? String(f.maxPrice / 100) : undefined,
    rating: f.rating ? String(f.rating) : undefined,
    stock: f.inStock ? "1" : undefined,
    discount: f.discount ? String(f.discount) : undefined,
    weight: f.weight ? String(f.weight) : undefined,
    sort: f.sort,
    page: f.page && f.page > 1 ? String(f.page) : undefined,
  };
}

export async function CatalogView({ filters, basePath, lockedCategory }: { filters: ProductFilters; basePath: string; lockedCategory?: string }) {
  const effective = { ...filters, category: lockedCategory ?? filters.category };
  const [result, categories, weights] = await Promise.all([listProducts(effective), getPublishedCategories(), getWeightOptions()]);
  const params = toParams(filters, lockedCategory);
  const activeCount = [params.category, params.min, params.max, params.rating, params.stock, params.discount, params.weight].filter(Boolean).length;

  const filterForm = (
    <form action={basePath} method="get" className="space-y-6" aria-label="Product filters">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      {!lockedCategory && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Category</legend>
          <select name="category" defaultValue={filters.category ?? ""} className={controlClass} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Price (₹)</legend>
        <div className="flex items-center gap-2">
          <input type="number" name="min" min={0} step={1} placeholder="Min" aria-label="Minimum price" defaultValue={params.min} className={controlClass} />
          <span aria-hidden>–</span>
          <input type="number" name="max" min={0} step={1} placeholder="Max" aria-label="Maximum price" defaultValue={params.max} className={controlClass} />
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Customer rating</legend>
        {[4, 3].map((r) => (
          <label key={r} className="flex items-center gap-2 py-1 text-sm">
            <input type="radio" name="rating" value={r} defaultChecked={filters.rating === r} className="accent-forest-800" /> {r}★ & above
          </label>
        ))}
        <label className="flex items-center gap-2 py-1 text-sm">
          <input type="radio" name="rating" value="" defaultChecked={!filters.rating} className="accent-forest-800" /> Any
        </label>
      </fieldset>
      {weights.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Pack size</legend>
          <select name="weight" defaultValue={params.weight ?? ""} className={controlClass} aria-label="Pack size">
            <option value="">Any size</option>
            {weights.map((w) => (
              <option key={w} value={w}>
                {w >= 1000 ? `${w / 1000} kg` : `${w} g`}
              </option>
            ))}
          </select>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Discount</legend>
        <select name="discount" defaultValue={params.discount ?? ""} className={controlClass} aria-label="Minimum discount">
          <option value="">Any</option>
          {[10, 15, 20, 25].map((d) => (
            <option key={d} value={d}>
              {d}% or more
            </option>
          ))}
        </select>
      </fieldset>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" name="stock" value="1" defaultChecked={filters.inStock} className="h-4 w-4 accent-forest-800" /> In stock only
      </label>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        {activeCount > 0 && (
          <Link href={`${basePath}${filters.q ? `?q=${encodeURIComponent(filters.q)}` : ""}`} className="inline-flex items-center px-3 text-sm font-semibold text-forest-800 underline">
            Clear
          </Link>
        )}
      </div>
    </form>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="card sticky top-28 p-5">{filterForm}</div>
      </aside>
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {result.total} product{result.total === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <details className="lg:hidden">
              <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-beige-400 px-4 py-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters{activeCount ? ` (${activeCount})` : ""}
              </summary>
              <div className="card absolute left-4 right-4 z-30 mt-2 p-5">{filterForm}</div>
            </details>
            <form action={basePath} method="get" className="flex items-center gap-2">
              {Object.entries(params).map(([k, v]) => (v && k !== "sort" && k !== "page" ? <input key={k} type="hidden" name={k} value={v} /> : null))}
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <AutoSubmitSelect id="sort" name="sort" defaultValue={filters.sort ?? "featured"} options={Object.entries(SORTS).map(([value, label]) => ({ value, label }))} />
            </form>
          </div>
        </div>
        {result.items.length ? (
          <>
            <ProductGrid products={result.items} />
            <Pagination page={result.page} pages={result.pages} basePath={basePath} params={params} />
          </>
        ) : (
          <div className="card flex flex-col items-center px-6 py-16 text-center">
            <SearchX className="h-10 w-10 text-gold-500" aria-hidden />
            <h2 className="mt-4 text-2xl">No products found</h2>
            <p className="mt-2 max-w-md text-muted">Try removing some filters or searching for something else — almonds, cashews, dates…</p>
            <Link href="/shop" className="mt-6 font-semibold text-forest-800 underline">
              View all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
