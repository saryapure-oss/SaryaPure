"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageRead } from "@/app/actions/admin/leads";

export function MarkReadButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markMessageRead(id);
          router.refresh();
        })
      }
      className="shrink-0 text-sm font-medium text-forest-800 hover:underline disabled:opacity-50"
    >
      Mark as read
    </button>
  );
}
