import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { AddressCard } from "@/components/store/address-card";
import { AddAddressSection } from "@/components/store/add-address-section";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Saved Addresses</h2>
      </div>
      <AddAddressSection hasAddresses={addresses.length > 0} />
      {addresses.length === 0 && <p className="text-muted">You have no saved addresses yet.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {addresses.map((a) => (
          <AddressCard key={a.id} address={a} />
        ))}
      </div>
    </div>
  );
}
