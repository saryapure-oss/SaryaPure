import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { STATUS_FLOW } from "@/lib/services/orders";
import { formatDate, titleCase } from "@/lib/utils";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
};

export function OrderTimeline({ status, history }: { status: string; history: { status: string; createdAt: string }[] }) {
  if (status === "CANCELLED" || status.startsWith("REFUND")) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <XCircle className="h-6 w-6 text-red-700" aria-hidden />
        <div>
          <p className="font-semibold text-red-800">{titleCase(status)}</p>
          {history.find((h) => h.status === status) && <p className="text-sm text-red-700">{formatDate(history.find((h) => h.status === status)!.createdAt, true)}</p>}
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(status as (typeof STATUS_FLOW)[number]);
  const dateFor = (s: string) => history.find((h) => h.status === s)?.createdAt;

  return (
    <ol className="relative space-y-0">
      {STATUS_FLOW.map((s, i) => {
        const done = i <= currentIdx;
        const date = dateFor(s);
        return (
          <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
            {i < STATUS_FLOW.length - 1 && <span className={cn("absolute left-3 top-7 h-full w-0.5 -translate-x-1/2", done && i < currentIdx ? "bg-forest-700" : "bg-beige-300")} aria-hidden />}
            {done ? <CheckCircle2 className="relative z-10 h-6 w-6 shrink-0 text-forest-700" aria-hidden /> : <Circle className="relative z-10 h-6 w-6 shrink-0 text-beige-400" aria-hidden />}
            <div>
              <p className={cn("font-semibold", done ? "text-ink" : "text-muted")}>{LABELS[s]}</p>
              {date && <p className="text-sm text-muted">{formatDate(date, true)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
