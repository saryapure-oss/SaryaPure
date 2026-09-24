"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addAddress } from "@/app/actions/customer-orders";
import { AddressForm } from "./address-form";

export function AddAddressSection({ hasAddresses }: { hasAddresses: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  void hasAddresses;
  return (
    <div>
      {!showForm && (
        <button type="button" onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 rounded-full border border-forest-900 px-4 py-2 text-sm font-semibold hover:bg-forest-900 hover:text-cream-50">
          <Plus className="h-4 w-4" /> Add address
        </button>
      )}
      {showForm && (
        <div className="card mt-4 p-5">
          <AddressForm
            action={addAddress}
            onDone={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
          <button type="button" onClick={() => setShowForm(false)} className="mt-2 text-sm text-muted hover:underline">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
