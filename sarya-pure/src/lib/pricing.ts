/**
 * Pure pricing engine. Given authoritative data loaded from the database it computes
 * every monetary value of a cart/order. Nothing here trusts client input.
 * All amounts are integers in paise.
 */

export type PricingLine = {
  variantId: string;
  productId: string;
  categoryId: string;
  unitPrice: number;
  quantity: number;
  taxRate: number; // percent
};

export type PricingCoupon = {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  scope: "ALL" | "PRODUCTS" | "CATEGORIES";
  productIds: string[];
  categoryIds: string[];
};

export type ShippingRule = {
  rate: number;
  freeAbove: number | null;
  serviceable: boolean;
};

export type PricingInput = {
  lines: PricingLine[];
  coupon?: PricingCoupon | null;
  shipping: ShippingRule;
  codFee?: number;
  pricesIncludeTax: boolean;
};

export type PricedLine = PricingLine & { lineSubtotal: number; discount: number; tax: number; lineTotal: number };

export type PricingResult = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  tax: number;
  total: number;
  couponError: string | null;
  couponApplied: boolean;
  freeShippingRemaining: number;
};

export function couponEligibleLine(line: PricingLine, coupon: PricingCoupon): boolean {
  if (coupon.scope === "ALL") return true;
  if (coupon.scope === "PRODUCTS") return coupon.productIds.includes(line.productId);
  return coupon.categoryIds.includes(line.categoryId);
}

/** Split `total` across `weights` proportionally using the largest remainder method (sums exactly). */
export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floors[i]! += 1;
    remainder -= 1;
  }
  return floors;
}

export function computeCouponDiscount(lines: PricingLine[], coupon: PricingCoupon): { discount: number; error: string | null } {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  if (subtotal < coupon.minOrderAmount) {
    return { discount: 0, error: `Add items worth ₹${((coupon.minOrderAmount - subtotal) / 100).toFixed(0)} more to use ${coupon.code}.` };
  }
  const eligible = lines.filter((l) => couponEligibleLine(l, coupon)).reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  if (eligible <= 0) return { discount: 0, error: `${coupon.code} is not applicable to the items in your cart.` };
  let discount = coupon.type === "PERCENTAGE" ? Math.floor((eligible * Math.min(coupon.value, 100)) / 100) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, eligible));
  return { discount, error: null };
}

export function calculatePricing(input: PricingInput): PricingResult {
  const lines = input.lines.filter((l) => l.quantity > 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let couponError: string | null = null;
  if (input.coupon) {
    const r = computeCouponDiscount(lines, input.coupon);
    discount = r.discount;
    couponError = r.error;
  }

  const weights = lines.map((l) => (input.coupon && couponEligibleLine(l, input.coupon) ? l.unitPrice * l.quantity : 0));
  const lineDiscounts = allocate(discount, weights);

  let tax = 0;
  const priced: PricedLine[] = lines.map((l, i) => {
    const lineSubtotal = l.unitPrice * l.quantity;
    const d = lineDiscounts[i] ?? 0;
    const taxable = lineSubtotal - d;
    const lineTax = input.pricesIncludeTax
      ? Math.round((taxable * l.taxRate) / (100 + l.taxRate))
      : Math.round((taxable * l.taxRate) / 100);
    tax += lineTax;
    return { ...l, lineSubtotal, discount: d, tax: lineTax, lineTotal: taxable + (input.pricesIncludeTax ? 0 : lineTax) };
  });

  const afterDiscount = subtotal - discount;
  const { rate, freeAbove } = input.shipping;
  const shipping = lines.length === 0 ? 0 : freeAbove != null && afterDiscount >= freeAbove ? 0 : rate;
  const freeShippingRemaining = freeAbove != null && lines.length ? Math.max(0, freeAbove - afterDiscount) : 0;
  const codFee = lines.length ? (input.codFee ?? 0) : 0;
  const total = afterDiscount + shipping + codFee + (input.pricesIncludeTax ? 0 : tax);

  return {
    lines: priced,
    subtotal,
    discount,
    shipping,
    codFee,
    tax,
    total,
    couponError,
    couponApplied: Boolean(input.coupon) && !couponError && discount > 0,
    freeShippingRemaining,
  };
}
