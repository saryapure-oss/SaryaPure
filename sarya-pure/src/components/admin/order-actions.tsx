"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeOrderStatus, adminRefundOrder, adminCancelOrder, updateAdminNote } from "@/app/actions/admin/orders";
import { Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";
import type { OrderStatus } from "@/generated/prisma/enums";

export function OrderStatusForm({
  orderId,
  nextStatuses,
  trackingNumber,
  courierName,
}: {
  orderId: string;
  nextStatuses: OrderStatus[];
  trackingNumber: string | null;
  courierName: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(changeOrderStatus.bind(null, orderId), initialActionState);
  const [status, setStatus] = useState(nextStatuses[0]);
  const showTracking = status === "SHIPPED" || status === "OUT_FOR_DELIVERY";

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <Select
        label="New status"
        name="status"
        required
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        options={nextStatuses.map((s) => ({ value: s, label: s.replaceAll("_", " ") }))}
      />
      {showTracking && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Tracking number" name="trackingNumber" defaultValue={trackingNumber ?? ""} />
          <Input label="Courier name" name="courierName" defaultValue={courierName ?? ""} />
        </div>
      )}
      <Input label="Note (optional)" name="note" maxLength={300} />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Updating…">
        Update status
      </SubmitButton>
    </form>
  );
}

export function RefundForm({ orderId, maxAmount }: { orderId: string; maxAmount: number }) {
  const [state, formAction] = useActionState<ActionState, FormData>(adminRefundOrder.bind(null, orderId), initialActionState);
  return (
    <form action={formAction} className="mt-3 space-y-3">
      <Input label="Refund amount (paise)" name="amount" type="number" min={1} max={maxAmount} required defaultValue={maxAmount} error={state.fieldErrors?.amount} />
      <Input label="Note (optional)" name="note" maxLength={300} />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" variant="secondary" pendingText="Processing…">
        Process refund
      </SubmitButton>
    </form>
  );
}

export function AdminNoteForm({ orderId, note }: { orderId: string; note: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <form
      className="mt-3 space-y-3"
      action={(fd) =>
        start(async () => {
          const res = await updateAdminNote(orderId, String(fd.get("note") ?? ""));
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        })
      }
    >
      <Textarea label="Internal note (not visible to the customer)" name="note" maxLength={2000} defaultValue={note} />
      <button type="submit" disabled={pending} className="h-9 rounded-full bg-forest-900 px-4 text-sm font-semibold text-cream-50 disabled:opacity-50">
        {pending ? "Saving…" : "Save note"}
      </button>
    </form>
  );
}

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const reason = window.prompt("Reason for cancellation:", "Cancelled by admin");
        if (reason === null) return;
        start(async () => {
          const res = await adminCancelOrder(orderId, reason);
          toast(res.message, res.ok ? "success" : "error");
          router.refresh();
        });
      }}
      className="mt-2 h-9 rounded-full bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
    >
      {pending ? "Cancelling…" : "Cancel this order"}
    </button>
  );
}
