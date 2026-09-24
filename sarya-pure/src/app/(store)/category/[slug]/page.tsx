import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { parseFilters } from "@/lib/services/catalog";
import { CatalogView } from "@/components/store/catalog-view";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CatalogSkeleton } from "@/components/store/skeletons";

async function getCategory(slug: string) {
  return db.category.findFirst({ where: { slug, isPublished: true } });
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategory(slug);
  if (!c) return { title: "Category not found" };
  return {
    title: c.seoTitle || `${c.name} — Buy Premium ${c.name} Online`,
    description: c.seoDescription || c.description || `Shop premium ${c.name.toLowerCase()} from Sarya Pure.`,
    alternates: { canonical: `/category/${c.slug}` },
    openGraph: { images: c.image && !c.image.endsWith(".svg") ? [c.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const filters = parseFilters(await searchParams);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Categories", href: "/categories" }, { label: category.name }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">{category.name}</h1>
      {category.description && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}
      <div className="mt-8">
        <Suspense key={JSON.stringify(filters)} fallback={<CatalogSkeleton />}>
          <CatalogView filters={filters} basePath={`/category/${category.slug}`} lockedCategory={category.slug} />
        </Suspense>
      </div>
    </div>
  );
}
