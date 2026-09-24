"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelMyOrder } from "@/app/actions/customer-orders";
import { Button } from "@/components/ui/button";
import { useToast } from "./toast";

export function CancelOrderButton({ orderNumber }: { orderNumber: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Cancel order
      </Button>
    );
  }

  return (
    <div className="card flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <label htmlFor="cancel-reason" className="sr-only">
        Reason for cancellation
      </label>
      <input id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancellation (optional)" className="h-10 flex-1 rounded-lg border border-beige-400 px-3 text-sm focus:border-forest-700 focus:outline-none" maxLength={300} />
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await cancelMyOrder(orderNumber, reason);
              toast(res.message, res.ok ? "success" : "error");
              if (res.ok) router.refresh();
              setOpen(false);
            })
          }
        >
          Confirm cancellation
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Keep order
        </Button>
      </div>
    </div>
  );
}
