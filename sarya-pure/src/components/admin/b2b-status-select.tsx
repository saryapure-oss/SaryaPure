"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateB2BStatus } from "@/app/actions/admin/leads";
import { useToast } from "@/components/store/toast";
import type { EnquiryStatus } from "@/generated/prisma/enums";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "CONVERTED", "CLOSED"];

export function B2BStatusSelect({ id, status }: { id: string; status: EnquiryStatus }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="mt-3">
      <label className="text-xs font-medium">
        Status
        <select
          defaultValue={status}
          disabled={pending}
          onChange={(e) =>
            start(async () => {
              const res = await updateB2BStatus(id, e.target.value as EnquiryStatus);
              toast(res.message, res.ok ? "success" : "error");
              router.refresh();
            })
          }
          className="mt-1 block h-9 rounded-lg border border-beige-400 bg-white px-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
