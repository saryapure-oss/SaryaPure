import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { InvoiceView } from "@/components/invoice/invoice-view";
import { PrintButton } from "@/components/store/print-button";

export const metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: PageProps<"/account/orders/[orderNumber]/invoice">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${orderNumber}/invoice`);
  const [order, settings] = await Promise.all([db.order.findFirst({ where: { orderNumber, userId: user.id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();
  return (
    <div className="bg-cream-200 py-8">
      <div className="no-print mx-auto mb-4 max-w-3xl px-4">
        <PrintButton />
      </div>
      <InvoiceView order={order} business={settings.business} legal={settings.legal} />
    </div>
  );
}
