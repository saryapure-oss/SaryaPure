import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getRelatedProducts, getBoughtTogether } from "@/lib/services/catalog";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPurchased } from "@/lib/services/orders";
import { getSettings } from "@/lib/settings";
import { discountPercent, formatINR } from "@/lib/money";
import { siteUrl, whatsappLink } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { DemoBadge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { Markdown } from "@/components/ui/markdown";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { ProductTabs } from "@/components/store/product-tabs";
import { ProductGrid } from "@/components/store/product-card";
import { TrackView } from "@/components/store/track-view";
import { ReviewsSection } from "@/components/store/reviews-section";
import { WhatsAppIcon } from "@/components/store/whatsapp-icon";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const image = product.images[0]?.url;
  return {
    title: product.seoTitle || `${product.name} — Buy Online`,
    description: product.seoDescription || product.shortDescription || product.name,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { images: image && !image.endsWith(".svg") ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, user, settings] = await Promise.all([getProductBySlug(slug), getCurrentUser(), getSettings()]);
  if (!product) notFound();

  const [related, boughtTogether, wishlistItem, reviews, purchased] = await Promise.all([
    getRelatedProducts(product.id, product.categoryId),
    getBoughtTogether(product.id, product.categoryId),
    user ? db.wishlistItem.findFirst({ where: { productId: product.id, wishlist: { userId: user.id } } }) : null,
    db.review.findMany({ where: { productId: product.id, status: "APPROVED" }, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    user ? hasPurchased(user.id, product.id) : false,
  ]);
  const userReview = user ? reviews.find((r) => r.userId === user.id) : undefined;

  const variants = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: v.price,
    mrp: v.mrp,
    available: v.inventory ? Math.max(0, v.inventory.stock - v.inventory.reserved) : 0,
    isDefault: v.isDefault,
  }));
  const cheapest = variants[0];
  const wa = whatsappLink(settings.business.whatsapp, `Hi, I'd like to ask about ${product.name}.`);

  const tabs = [
    { key: "description", label: "Description", content: product.description ? <Markdown>{product.description}</Markdown> : <Empty text="No description provided yet." /> },
    { key: "ingredients", label: "Ingredients", content: product.ingredients ? <p className="leading-7">{product.ingredients}</p> : <Empty text="Ingredient information will be added soon." /> },
    {
      key: "nutrition",
      label: "Nutrition",
      content: product.nutritionInfo ? <Markdown>{product.nutritionInfo}</Markdown> : <Empty text="Nutrition information for this product has not been published yet. Please check the product packaging or contact us." />,
    },
    { key: "allergens", label: "Allergens", content: product.allergens ? <p className="leading-7">{product.allergens}</p> : <Empty text="No allergen information provided yet." /> },
    { key: "storage", label: "Storage", content: product.storageInstructions ? <p className="leading-7">{product.storageInstructions}</p> : <Empty text="Store in a cool, dry place." /> },
    { key: "shipping", label: "Shipping", content: product.shippingInfo ? <p className="leading-7">{product.shippingInfo}</p> : <Empty text="See our Shipping Policy for details." /> },
    {
      key: "returns",
      label: "Returns",
      content: (
        <p className="leading-7">
          Please see our{" "}
          <Link href="/policies/return-refund-policy" className="text-forest-700 underline">
            Return & Refund Policy
          </Link>{" "}
          for eligibility and process.
        </p>
      ),
    },
  ];

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Shop", href: "/shop" }, { label: product.category.name, href: `/category/${product.category.slug}` }, { label: product.name }]} />
      {product.isDemo && (
        <p className="mt-3">
          <DemoBadge />
        </p>
      )}
      <TrackView type="product_view" productId={product.id} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <p className="text-xs uppercase tracking-wider text-brown-600">{product.category.name}</p>
          <h1 className="mt-1 text-4xl sm:text-5xl">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted">SKU: {product.sku}</span>
            {product.reviewCount > 0 && (
              <a href="#reviews" className="flex items-center gap-1.5 hover:underline">
                <Stars rating={product.avgRating} size={16} />
                <span className="text-muted">
                  {product.avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount === 1 ? "" : "s"})
                </span>
              </a>
            )}
          </div>
          {product.shortDescription && <p className="mt-4 text-lg leading-7 text-muted">{product.shortDescription}</p>}

          <div className="mt-6">
            <PurchasePanel productId={product.id} variants={variants} inWishlist={Boolean(wishlistItem)} maxQty={settings.commerce.maxQtyPerItem} />
          </div>

          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:underline">
              <WhatsAppIcon className="h-4 w-4" /> Ask us about this product on WhatsApp
            </a>
          )}

          {product.giftBox && (
            <div className="mt-8 rounded-2xl border border-gold-400/50 bg-gold-300/10 p-5">
              <h2 className="text-lg font-semibold text-forest-900">What&apos;s inside this hamper</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {product.giftBox.items.map((it) => (
                  <li key={it.id}>
                    {it.quantity} × {it.variant.product.name} ({it.variant.name})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 border-t border-beige-300">
        <ProductTabs tabs={tabs} />
      </div>

      <div id="reviews" className="mt-4 scroll-mt-24 border-t border-beige-300 pt-10">
        <ReviewsSection
          productId={product.id}
          avgRating={product.avgRating}
          reviewCount={product.reviewCount}
          reviews={reviews.map((r) => ({ id: r.id, rating: r.rating, title: r.title, body: r.body, imageUrl: r.imageUrl, isVerifiedPurchase: r.isVerifiedPurchase, createdAt: r.createdAt.toISOString(), userName: r.user.name }))}
          canReview={Boolean(user) && !userReview && purchased}
          isLoggedIn={Boolean(user)}
          hasPurchased={purchased}
          hasReviewed={Boolean(userReview)}
        />
      </div>

      {boughtTogether.length > 0 && (
        <section className="mt-14 border-t border-beige-300 pt-10">
          <h2 className="text-3xl">Frequently Bought Together</h2>
          <div className="mt-6">
            <ProductGrid products={boughtTogether} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14 border-t border-beige-300 pt-10">
          <h2 className="text-3xl">You May Also Like</h2>
          <div className="mt-6">
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription ?? product.seoDescription ?? undefined,
          sku: product.sku,
          image: product.images.map((i) => (i.url.startsWith("http") ? i.url : siteUrl(i.url))),
          ...(product.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.avgRating, reviewCount: product.reviewCount } } : {}),
          offers: variants.map((v) => ({
            "@type": "Offer",
            name: v.name,
            sku: v.sku,
            priceCurrency: "INR",
            price: (v.price / 100).toFixed(2),
            availability: v.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: siteUrl(`/products/${product.slug}`),
          })),
        }}
      />
      {cheapest && (
        <p className="sr-only">
          Starting from {formatINR(cheapest.price)}
          {cheapest.mrp > cheapest.price ? `, ${discountPercent(cheapest.price, cheapest.mrp)}% off MRP ${formatINR(cheapest.mrp)}` : ""}.
        </p>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-muted">{text}</p>;
}
