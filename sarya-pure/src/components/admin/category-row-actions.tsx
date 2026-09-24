"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/app/actions/admin/categories";
import { useToast } from "@/components/store/toast";

export function DeleteCategoryButton({ categoryId, name }: { categoryId: string; name: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete category "${name}"?`)) return;
        start(async () => {
          const res = await deleteCategory(categoryId);
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
