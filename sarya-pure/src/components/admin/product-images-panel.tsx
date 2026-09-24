"use client";
import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SmartImage } from "@/components/ui/smart-image";
import { uploadProductImage, deleteProductImage } from "@/app/actions/admin/products";
import { useToast } from "@/components/store/toast";

type Img = { id: string; url: string; alt: string | null };

export function ProductImagesPanel({ productId, images }: { productId: string; images: Img[] }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-2xl border border-beige-300 bg-white p-5">
      <h2 className="font-semibold">Images</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {images.map((img) => (
          <div key={img.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-beige-300">
            <SmartImage src={img.url} alt={img.alt ?? ""} fill className="object-cover" />
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteProductImage(img.id);
                  toast(res.message, res.ok ? "success" : "error");
                  router.refresh();
                })
              }
              className="absolute right-1 top-1 rounded-full bg-red-700/90 px-1.5 py-0.5 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p className="rounded-lg border border-dashed border-red-400 bg-red-50 px-3 py-2 text-sm text-red-800">
            No images yet — this product will show a blank tile on the storefront. Add at least one photo below.
          </p>
        )}
      </div>
      <form
        ref={formRef}
        className="mt-4"
        action={(fd) =>
          start(async () => {
            const res = await uploadProductImage(productId, fd);
            toast(res.message, res.ok ? "success" : "error");
            formRef.current?.reset();
            router.refresh();
          })
        }
      >
        <label className="text-sm font-medium">
          Add image (JPG, PNG, WebP or AVIF, up to 5&nbsp;MB)
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" required disabled={pending} className="mt-1.5 block text-sm" />
        </label>
        <button type="submit" disabled={pending} className="mt-3 h-10 rounded-lg bg-forest-900 px-4 text-sm font-semibold text-cream-50 disabled:opacity-50">
          {pending ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
