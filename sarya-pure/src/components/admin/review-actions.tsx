"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReview, toggleFeaturedReview } from "@/app/actions/reviews";
import { useToast } from "@/components/store/toast";

export function ReviewActions({ reviewId, status, isFeatured }: { reviewId: string; status: string; isFeatured: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const run = (action: "APPROVE" | "REJECT" | "DELETE") =>
    start(async () => {
      if (action === "DELETE" && !window.confirm("Delete this review permanently?")) return;
      const res = await moderateReview(reviewId, action);
      toast(res.message, res.ok ? "success" : "error");
      router.refresh();
    });

  return (
    <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
      {status !== "APPROVED" && (
        <button type="button" disabled={pending} onClick={() => run("APPROVE")} className="text-forest-800 hover:underline disabled:opacity-50">
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button type="button" disabled={pending} onClick={() => run("REJECT")} className="text-brown-700 hover:underline disabled:opacity-50">
          Reject
        </button>
      )}
      {status === "APPROVED" && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await toggleFeaturedReview(reviewId);
              toast(res.message, res.ok ? "success" : "error");
              router.refresh();
            })
          }
          className="text-sky-700 hover:underline disabled:opacity-50"
        >
          {isFeatured ? "Unfeature" : "Feature on homepage"}
        </button>
      )}
      <button type="button" disabled={pending} onClick={() => run("DELETE")} className="text-red-700 hover:underline disabled:opacity-50">
        Delete
      </button>
    </div>
  );
}
