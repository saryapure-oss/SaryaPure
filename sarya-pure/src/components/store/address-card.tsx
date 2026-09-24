"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAddress, setDefaultAddress, updateAddress } from "@/app/actions/customer-orders";
import { AddressForm } from "./address-form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "./toast";

type Address = { id: string; fullName: string; phone: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; pincode: string; isDefault: boolean };

export function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  if (editing) {
    return (
      <div className="card p-5">
        <AddressForm
          action={(prev, fd) => updateAddress(address.id, prev, fd)}
          defaults={{ ...address, line2: address.line2 ?? "", landmark: address.landmark ?? "" }}
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
        />
        <button type="button" onClick={() => setEditing(false)} className="mt-2 text-sm text-muted hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            {address.fullName} {address.isDefault && <Badge tone="green">Default</Badge>}
          </p>
          <p className="mt-1 text-sm text-muted">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            {address.landmark ? `, near ${address.landmark}` : ""}
            <br />
            {address.city}, {address.state} {address.pincode}
            <br />
            {address.phone}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        <button type="button" onClick={() => setEditing(true)} className="text-forest-800 hover:underline">
          Edit
        </button>
        {!address.isDefault && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setDefaultAddress(address.id);
                router.refresh();
              })
            }
            className="text-forest-800 hover:underline"
          >
            Set as default
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await deleteAddress(address.id);
              toast(res.message, res.ok ? "success" : "error");
              router.refresh();
            })
          }
          className="text-red-700 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
