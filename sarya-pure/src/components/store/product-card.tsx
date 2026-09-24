import Link from "next/link";
import type { ProductCardData } from "@/lib/services/catalog";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { QuickAdd } from "./quick-add";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const v = product.variants[0];
  const img = product.images[0];
  const available = v?.inventory ? v.inventory.stock - v.inventory.reserved : 0;
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-16px_rgb(31_61_43_/_0.28)]">
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream-200" tabIndex={-1} aria-hidden>
        {img ? (
          <SmartImage
            src={img.url}
            alt=""
            fill
            sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
            priority={priority}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          {product.maxDiscountPct > 0 && <Badge tone="gold">Up to {product.maxDiscountPct}% off</Badge>}
          {product.isBestSeller && <Badge tone="green">Best seller</Badge>}
        </div>
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-forest-950/75 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-cream-50">Out of stock</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wider text-brown-600">{product.category.name}</p>
        <h3 className="mt-1 font-sans text-base font-semibold leading-snug text-ink">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-forest-700">
            {product.name}
          </Link>
        </h3>
        {product.reviewCount > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <Stars rating={product.avgRating} size={14} />
            <span>({product.reviewCount})</span>
          </div>
        )}
        {product.isDemo && <DemoBadge className="mt-2 self-start" />}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {v ? <Price price={v.price} mrp={v.mrp} size="sm" prefix={v.name} /> : <span className="text-sm text-muted">Unavailable</span>}
          {v && available > 0 && <QuickAdd variantId={v.id} name={product.name} />}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
