"use client";
import { useState, useTransition } from "react";
import { Plus, Check } from "lucide-react";
import { addToCart } from "@/app/actions/cart";
import { useToast } from "./toast";

export function QuickAdd({ variantId, name }: { variantId: string; name: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await addToCart({ variantId, quantity: 1 });
          toast(res.message, res.ok ? "success" : "error");
          if (res.ok) {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }
        })
      }
      className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-900 text-cream-50 transition hover:bg-forest-700 disabled:opacity-60"
      aria-label={`Add ${name} to cart`}
    >
      {done ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
