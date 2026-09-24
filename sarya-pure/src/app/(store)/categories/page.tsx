import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCategories } from "@/lib/services/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SmartImage } from "@/components/ui/smart-image";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Sarya Pure categories: almonds, cashews, pistachios, walnuts, raisins, dates, figs, apricots, seeds, mixes, roasted nuts, snacks and gift hampers.",
  alternates: { canonical: "/categories" },
};

export default async function CategoriesPage() {
  const categories = await getPublishedCategories();
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Categories" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Shop by Category</h1>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.id}>
            <Link href={`/category/${c.slug}`} className="card group flex h-full overflow-hidden transition hover:-translate-y-0.5">
              <div className="relative w-2/5 shrink-0 bg-cream-200">
                {c.image && <SmartImage src={c.image} alt="" fill sizes="20vw" className="object-cover transition group-hover:scale-105" />}
              </div>
              <div className="p-5">
                <h2 className="text-2xl">{c.name}</h2>
                {c.description && <p className="mt-1 text-sm text-muted">{c.description}</p>}
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brown-600">
                  {c._count.products} product{c._count.products === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
