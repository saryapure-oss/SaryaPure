"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  if (!current) return <div className="aspect-square rounded-2xl bg-cream-200" />;
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-beige-300 bg-cream-200">
        <Image
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width:1024px) 45vw, 100vw"
          className="object-cover"
          unoptimized={current.url.endsWith(".svg")}
        />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === active}
                className={cn("relative block h-20 w-20 overflow-hidden rounded-xl border-2 bg-cream-200", i === active ? "border-forest-800" : "border-transparent hover:border-beige-400")}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" unoptimized={img.url.endsWith(".svg")} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
