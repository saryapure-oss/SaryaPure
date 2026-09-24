import { formatINR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { Settings } from "@/lib/settings-schema";

type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  email: string;
  phone: string;
  shipLine1: string;
  shipLine2: string | null;
  shipLandmark: string | null;
  shipCity: string;
  shipState: string;
  shipPincode: string;
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: { productName: string; variantName: string; sku: string; unitPrice: number; quantity: number; discount: number; tax: number; lineTotal: number; taxRate: unknown }[];
};

export function InvoiceView({ order, business, legal }: { order: InvoiceOrder; business: Settings["business"]; legal: Settings["legal"] }) {
  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-ink print:p-0">
      <div className="flex items-start justify-between border-b border-beige-300 pb-6">
        <div>
          <h1 className="font-serif text-3xl text-forest-900">{business.companyName}</h1>
          {business.address && <p className="mt-1 whitespace-pre-line text-sm text-muted">{business.address}</p>}
          <p className="mt-1 text-sm text-muted">
            {business.email} {business.phone && `· ${business.phone}`}
          </p>
          {(legal.gstin || legal.fssai) && (
            <p className="mt-1 text-sm text-muted">
              {legal.gstin && `GSTIN: ${legal.gstin}`} {legal.fssai && `· FSSAI: ${legal.fssai}`}
            </p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold text-forest-900">Tax Invoice</h2>
          <p className="mt-1 text-sm">
            <span className="text-muted">Order:</span> {order.orderNumber}
          </p>
          <p className="text-sm">
            <span className="text-muted">Date:</span> {formatDate(order.createdAt)}
          </p>
          <p className="text-sm">
            <span className="text-muted">Payment:</span> {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"} ({order.paymentStatus})
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-brown-600">Billed / Shipped to</h3>
          <p className="mt-1 text-sm leading-6">
            {order.customerName}
            <br />
            {order.shipLine1}
            {order.shipLine2 ? `, ${order.shipLine2}` : ""}
            {order.shipLandmark ? `, near ${order.shipLandmark}` : ""}
            <br />
            {order.shipCity}, {order.shipState} {order.shipPincode}
            <br />
            {order.phone} · {order.email}
          </p>
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-beige-400 text-left text-xs uppercase tracking-wide text-brown-600">
            <th className="py-2">Item</th>
            <th className="py-2">SKU</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Discount</th>
            <th className="py-2 text-right">Tax</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={idx} className="border-b border-beige-200">
              <td className="py-2.5">
                {i.productName}
                <span className="block text-xs text-muted">{i.variantName}</span>
              </td>
              <td className="py-2.5 text-xs">{i.sku}</td>
              <td className="py-2.5 text-right">{formatINR(i.unitPrice)}</td>
              <td className="py-2.5 text-right">{i.quantity}</td>
              <td className="py-2.5 text-right">{i.discount ? formatINR(i.discount) : "—"}</td>
              <td className="py-2.5 text-right">{formatINR(i.tax)}</td>
              <td className="py-2.5 text-right font-medium">{formatINR(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-64 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{formatINR(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">Discount</span>
            <span>− {formatINR(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span>
        </div>
        {order.codFee > 0 && (
          <div className="flex justify-between">
            <span className="text-muted">COD fee</span>
            <span>{formatINR(order.codFee)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">GST (included)</span>
          <span>{formatINR(order.tax)}</span>
        </div>
        <div className="flex justify-between border-t border-beige-400 pt-2 text-base font-semibold text-forest-900">
          <span>Total</span>
          <span>{formatINR(order.total)}</span>
        </div>
      </div>

      <p className="mt-10 border-t border-beige-300 pt-4 text-xs text-muted">
        This is a computer-generated invoice from {business.companyName}. For questions, contact {business.email || "us via the Contact page"}.
      </p>
    </div>
  );
}
