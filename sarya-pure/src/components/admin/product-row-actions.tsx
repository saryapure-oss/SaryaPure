"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleProductPublish, deleteProduct } from "@/app/actions/admin/products";
import { useToast } from "@/components/store/toast";

export function PublishToggle({ productId, isPublished }: { productId: string; isPublished: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleProductPublish(productId);
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        })
      }
      className="text-sm font-medium text-forest-800 hover:underline disabled:opacity-50"
    >
      {isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}

export function DeleteProductButton({ productId, name }: { productId: string; name: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        start(async () => {
          const res = await deleteProduct(productId);
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        });
      }}
      className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
    >
      Delete
    </button>
  );
}
