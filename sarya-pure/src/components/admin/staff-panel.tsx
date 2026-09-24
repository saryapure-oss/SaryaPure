"use client";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { grantAdminAccess, updateStaffRole, setStaffActive, revokeAdminAccess } from "@/app/actions/admin/users";
import { Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { initialActionState, type ActionState } from "@/lib/validation/common";
import { useToast } from "@/components/store/toast";
import type { Role } from "@/generated/prisma/enums";

type Staff = { id: string; name: string; email: string; role: Role; isActive: boolean; lastLoginAt: Date | null; createdAt: Date };

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin — day-to-day store management" },
  { value: "SUPER_ADMIN", label: "Super Admin — full access, including settings, shipping and other staff" },
];

export function GrantAdminAccessForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(grantAdminAccess, initialActionState);
  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-dashed border-beige-400 bg-white p-4">
      <p className="text-sm text-muted">
        Grant admin access to someone who has already <strong>registered a regular account</strong> on the storefront with this email. They&apos;ll sign in with the password
        they already set — no new password is created here.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input label="Email address" name="email" type="email" required maxLength={254} error={state.fieldErrors?.email} />
        <Select label="Role" name="role" options={ROLE_OPTIONS} defaultValue="ADMIN" />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pendingText="Granting…">
        Grant access
      </SubmitButton>
    </form>
  );
}

export function StaffRow({ staff, isSelf }: { staff: Staff; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-beige-300 bg-white p-4">
      <div>
        <p className="font-medium">
          {staff.name} {isSelf && <span className="text-xs font-normal text-muted">(you)</span>}
        </p>
        <p className="text-sm text-muted">{staff.email}</p>
        <p className="mt-1 text-xs text-muted">
          Joined {formatDate(staff.createdAt)} · Last sign-in {staff.lastLoginAt ? formatDate(staff.lastLoginAt, true) : "never"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={staff.isActive ? "green" : "gray"}>{staff.isActive ? "Active" : "Deactivated"}</Badge>
        {isSelf ? (
          <Badge tone="blue">{staff.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</Badge>
        ) : (
          <select
            defaultValue={staff.role}
            disabled={pending}
            onChange={(e) =>
              start(async () => {
                const res = await updateStaffRole(staff.id, e.target.value as "ADMIN" | "SUPER_ADMIN");
                toast(res.message, res.ok ? "success" : "error");
                router.refresh();
              })
            }
            className="h-9 rounded-lg border border-beige-400 bg-white px-2 text-sm"
          >
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        )}
        {!isSelf && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await setStaffActive(staff.id, !staff.isActive);
                  toast(res.message, res.ok ? "success" : "error");
                  router.refresh();
                })
              }
              className="text-sm font-medium text-forest-800 hover:underline disabled:opacity-50"
            >
              {staff.isActive ? "Deactivate" : "Reactivate"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Remove admin access for ${staff.email}? They will become a regular customer account.`)) return;
                start(async () => {
                  const res = await revokeAdminAccess(staff.id);
                  toast(res.message, res.ok ? "success" : "error");
                  router.refresh();
                });
              }}
              className="text-sm font-medium text-red-700 hover:underline disabled:opacity-50"
            >
              Remove access
            </button>
          </>
        )}
      </div>
    </div>
  );
}
