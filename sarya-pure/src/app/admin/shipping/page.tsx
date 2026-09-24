import { db } from "@/lib/db";
import { ShippingZoneRow, ShippingZoneNewForm } from "@/components/admin/shipping-zone-panel";

export const metadata = { title: "Shipping Zones" };

export default async function AdminShippingPage() {
  const zones = await db.shippingZone.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Shipping Zones</h1>
        <p className="mt-1 text-sm text-muted">
          PIN codes are matched by prefix (e.g. &ldquo;110&rdquo; matches all Delhi PINs). Orders from unmatched PINs fall back to the flat rate in Settings when allowed.
        </p>
      </div>
      <ShippingZoneNewForm />
      <div className="space-y-3">
        {zones.map((z) => (
          <ShippingZoneRow key={z.id} zone={z} />
        ))}
      </div>
    </div>
  );
}
