import { discountPercent, formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({ price, mrp, size = "md", className, prefix }: { price: number; mrp?: number | null; size?: "sm" | "md" | "lg"; className?: string; prefix?: string }) {
  const off = mrp ? discountPercent(price, mrp) : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-semibold text-forest-900", size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg")}>
        {prefix && <span className="mr-1 text-sm font-normal text-muted">{prefix}</span>}
        {formatINR(price)}
      </span>
      {off > 0 && mrp && (
        <>
          <span className="text-sm text-muted line-through">
            <span className="sr-only">MRP </span>
            {formatINR(mrp)}
          </span>
          <span className="text-sm font-semibold text-brown-600">{off}% off</span>
        </>
      )}
    </div>
  );
}
