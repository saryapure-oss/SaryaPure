import { formatINR } from "@/lib/money";
import type { PricingResult } from "@/lib/pricing";

export function OrderSummary({ pricing, freeShippingRemaining, showCodFee = false }: { pricing: PricingResult; freeShippingRemaining: number; showCodFee?: boolean }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <Row label="Subtotal" value={formatINR(pricing.subtotal)} />
      {pricing.discount > 0 && <Row label="Discount" value={`− ${formatINR(pricing.discount)}`} valueClass="text-forest-700" />}
      <Row label="Shipping" value={pricing.shipping === 0 ? "Free" : formatINR(pricing.shipping)} valueClass={pricing.shipping === 0 ? "text-forest-700" : undefined} />
      {showCodFee && pricing.codFee > 0 && <Row label="COD fee" value={formatINR(pricing.codFee)} />}
      <Row label="Tax (GST)" value={pricing.tax > 0 ? `${formatINR(pricing.tax)} (incl.)` : "Included"} />
      {freeShippingRemaining > 0 && (
        <p className="rounded-lg bg-gold-300/25 px-3 py-2 text-xs font-medium text-brown-700">Add {formatINR(freeShippingRemaining)} more to get free shipping!</p>
      )}
      <div className="mt-2 flex items-center justify-between border-t border-beige-300 pt-3 text-base font-semibold text-forest-900">
        <dt>Total</dt>
        <dd data-testid="order-total">{formatINR(pricing.total)}</dd>
      </div>
    </dl>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}
