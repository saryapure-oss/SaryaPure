import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { WishlistGrid } from "@/components/store/wishlist-grid";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: "Wishlist" }]} />
        <div className="mt-8">
          <EmptyState title="Sign in to view your wishlist" text="Save your favourite products and access them from any device." cta={{ href: "/login?next=/wishlist", label: "Sign in" }} icon={<Heart className="h-10 w-10" />} />
        </div>
      </div>
    );
  }

  const items = await db.wishlistItem.findMany({
    where: { wishlist: { userId: user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isPublished: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, alt: true } },
          variants: { where: { isActive: true }, orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }], take: 1, select: { id: true, name: true, price: true, mrp: true, inventory: { select: { stock: true, reserved: true } } } },
        },
      },
    },
  });
  const products = items.filter((i) => i.product.isPublished).map((i) => i.product);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Wishlist" }]} />
      <h1 className="mt-4 text-4xl sm:text-5xl">Your Wishlist</h1>
      {products.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Your wishlist is empty" text="Tap the heart icon on any product to save it here." cta={{ href: "/shop", label: "Browse products" }} icon={<Heart className="h-10 w-10" />} />
        </div>
      ) : (
        <div className="mt-8">
          <WishlistGrid products={products} />
        </div>
      )}
      <p className="mt-8 text-sm text-muted">
        <ButtonLink href="/shop" variant="secondary" size="sm">
          Continue shopping
        </ButtonLink>
      </p>
    </div>
  );
}
