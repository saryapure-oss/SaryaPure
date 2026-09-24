"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { addToCart, buyNow } from "@/app/actions/cart";
import { toggleWishlist } from "@/app/actions/wishlist";
import { formatINR, discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "./toast";

export type PanelVariant = { id: string; name: string; sku: string; price: number; mrp: number; available: number; isDefault: boolean };

export function PurchasePanel({
  productId,
  variants,
  inWishlist: initialWishlist,
  maxQty,
  lowStockThreshold = 10,
}: {
  productId: string;
  variants: PanelVariant[];
  inWishlist: boolean;
  maxQty: number;
  lowStockThreshold?: number;
}) {
  const initial = variants.find((v) => v.isDefault && v.available > 0) ?? variants.find((v) => v.available > 0) ?? variants[0];
  const [selectedId, setSelectedId] = useState(initial?.id);
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(initialWishlist);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const v = variants.find((x) => x.id === selectedId) ?? initial;
  if (!v) return <p className="text-muted">This product is currently unavailable.</p>;
  const limit = Math.max(1, Math.min(v.available, maxQty));
  const off = discountPercent(v.price, v.mrp);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold text-forest-900" data-testid="variant-price">
            {formatINR(v.price)}
          </span>
          {off > 0 && (
            <>
              <span className="text-lg text-muted line-through">
                <span className="sr-only">MRP </span>
                {formatINR(v.mrp)}
              </span>
              <span className="rounded-full bg-gold-300/50 px-2.5 py-0.5 text-sm font-semibold text-gold-700">{off}% off</span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">MRP inclusive of all taxes · SKU: {v.sku}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Pack size</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {variants.map((opt) => (
            <label
              key={opt.id}
              className={cn(
                "relative cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold-500",
                opt.id === v.id ? "border-forest-800 bg-forest-50 font-semibold text-forest-900" : "border-beige-400 bg-white hover:border-forest-600",
                opt.available <= 0 && "opacity-50",
              )}
            >
              <input
                type="radio"
                name="variant"
                value={opt.id}
                checked={opt.id === v.id}
                onChange={() => {
                  setSelectedId(opt.id);
                  setQty(1);
                }}
                className="sr-only"
              />
              <span className="block">{opt.name}</span>
              <span className="block text-xs text-muted">{opt.available > 0 ? formatINR(opt.price) : "Sold out"}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className={cn("text-sm font-semibold", v.available <= 0 ? "text-red-700" : v.available <= lowStockThreshold ? "text-brown-600" : "text-forest-700")} aria-live="polite">
        {v.available <= 0 ? "Out of stock" : v.available <= lowStockThreshold ? `Only ${v.available} left — order soon` : "In stock"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 items-center rounded-full border border-beige-400 bg-white" role="group" aria-label="Quantity">
          <button type="button" className="flex h-12 w-11 items-center justify-center rounded-l-full hover:bg-beige-200 disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={limit}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(limit, Number(e.target.value) || 1)))}
            className="h-12 w-12 border-0 bg-transparent text-center font-semibold [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Quantity"
          />
          <button type="button" className="flex h-12 w-11 items-center justify-center rounded-r-full hover:bg-beige-200 disabled:opacity-40" onClick={() => setQty((q) => Math.min(limit, q + 1))} disabled={qty >= limit} aria-label="Increase quantity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            start(async () => {
              const res = await toggleWishlist(productId);
              if (res.requiresLogin) {
                router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
                return;
              }
              if (res.ok) setWish(Boolean(res.inWishlist));
              toast(res.message, res.ok ? "success" : "error");
            })
          }
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-beige-400 bg-white hover:border-forest-700"
          aria-pressed={wish}
          aria-label={wish ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-5 w-5", wish ? "fill-red-600 text-red-600" : "text-forest-900")} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          disabled={pending || v.available <= 0}
          onClick={() =>
            start(async () => {
              const res = await addToCart({ variantId: v.id, quantity: qty });
              toast(res.message, res.ok ? "success" : "error");
            })
          }
        >
          <ShoppingBag className="h-5 w-5" aria-hidden /> Add to Cart
        </Button>
        <Button
          size="lg"
          variant="gold"
          disabled={pending || v.available <= 0}
          onClick={() =>
            start(async () => {
              const res = await buyNow({ variantId: v.id, quantity: qty });
              if (res && !res.ok) toast(res.message, "error");
            })
          }
        >
          <Zap className="h-5 w-5" aria-hidden /> Buy Now
        </Button>
      </div>
    </div>
  );
}
