"use client";
import { useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, X, Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR } from "@/lib/money";
import { updateCartItem, removeCartItem, moveCartItemToWishlist } from "@/app/actions/cart";
import type { CartLineView } from "@/lib/services/cart";
import { useToast } from "./toast";

export function CartLine({ line, isLoggedIn }: { line: CartLineView; isLoggedIn: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();

  function setQty(q: number) {
    start(async () => {
      const res = await updateCartItem({ itemId: line.itemId, quantity: q });
      if (!res.ok) toast(res.message, "error");
    });
  }

  return (
    <li className="flex gap-4 border-b border-beige-300 py-5 last:border-0" data-testid="cart-line">
      <Link href={`/products/${line.productSlug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-200">
        {line.image && <SmartImage src={line.image} alt={line.imageAlt} fill sizes="96px" className="object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${line.productSlug}`} className="font-semibold text-ink hover:text-forest-700">
              {line.productName}
            </Link>
            <p className="text-sm text-muted">{line.variantName}</p>
          </div>
          <button type="button" onClick={() => start(async () => { await removeCartItem(line.itemId); })} disabled={pending} className="rounded-full p-1.5 text-muted hover:bg-beige-200 hover:text-ink" aria-label={`Remove ${line.productName} from cart`}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {line.problem && (
          <p role="alert" className="mt-1 text-sm font-medium text-red-700">
            {line.problem}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex h-10 items-center rounded-full border border-beige-400 bg-white" role="group" aria-label={`Quantity for ${line.productName}`}>
            <button type="button" className="flex h-10 w-9 items-center justify-center rounded-l-full hover:bg-beige-200 disabled:opacity-40" onClick={() => setQty(line.quantity - 1)} disabled={pending} aria-label="Decrease quantity">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              className="flex h-10 w-9 items-center justify-center rounded-r-full hover:bg-beige-200 disabled:opacity-40"
              onClick={() => setQty(line.quantity + 1)}
              disabled={pending || line.quantity >= line.available}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                type="button"
                onClick={() =>
                  start(async () => {
                    const res = await moveCartItemToWishlist(line.itemId);
                    toast(res.message, res.ok ? "success" : "error");
                  })
                }
                disabled={pending}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-forest-800"
              >
                <Heart className="h-3.5 w-3.5" /> Save for later
              </button>
            )}
            <span className="font-semibold text-forest-900" data-testid="line-subtotal">
              {formatINR(line.lineSubtotal)}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
