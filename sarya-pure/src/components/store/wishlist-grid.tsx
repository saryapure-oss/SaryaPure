"use client";
import { useTransition } from "react";
import Link from "next/link";
import { X, ShoppingBag } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { removeFromWishlist, moveWishlistToCart } from "@/app/actions/wishlist";
import { useToast } from "./toast";

type WProduct = {
  id: string;
  name: string;
  slug: string;
  images: { url: string; alt: string | null }[];
  variants: { id: string; name: string; price: number; mrp: number; inventory: { stock: number; reserved: number } | null }[];
};

export function WishlistGrid({ products }: { products: WProduct[] }) {
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const v = p.variants[0];
        const available = v?.inventory ? v.inventory.stock - v.inventory.reserved : 0;
        return (
          <li key={p.id} className="card relative overflow-hidden">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await removeFromWishlist(p.id);
                  toast(res.message, "info");
                })
              }
              className="absolute right-2 top-2 z-10 rounded-full bg-cream-50/90 p-1.5 hover:bg-cream-50"
              aria-label={`Remove ${p.name} from wishlist`}
            >
              <X className="h-4 w-4" />
            </button>
            <Link href={`/products/${p.slug}`} className="relative block aspect-square bg-cream-200">
              {p.images[0] && <SmartImage src={p.images[0].url} alt={p.images[0].alt ?? p.name} fill sizes="25vw" className="object-cover" />}
            </Link>
            <div className="p-3">
              <Link href={`/products/${p.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-forest-700">
                {p.name}
              </Link>
              {v && <Price price={v.price} mrp={v.mrp} size="sm" className="mt-1.5" />}
              <button
                type="button"
                disabled={pending || available <= 0}
                onClick={() =>
                  start(async () => {
                    const res = await moveWishlistToCart(p.id);
                    toast(res.message, res.ok ? "success" : "error");
                  })
                }
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-forest-900 py-2 text-xs font-semibold text-cream-50 hover:bg-forest-700 disabled:opacity-50"
              >
                <ShoppingBag className="h-3.5 w-3.5" /> {available > 0 ? "Move to cart" : "Out of stock"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
