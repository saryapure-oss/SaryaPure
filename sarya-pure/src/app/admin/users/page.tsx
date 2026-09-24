import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { GrantAdminAccessForm, StaffRow } from "@/components/admin/staff-panel";

export const metadata = { title: "Staff & Access" };

export default async function AdminUsersPage() {
  const me = await requireAdminPage("users:manage");

  const staff = await db.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">Staff & Access</h1>
        <p className="mt-1 text-sm text-muted">{staff.length} staff account(s). Only Super Admins can manage staff access.</p>
      </div>

      <GrantAdminAccessForm />

      <div className="space-y-3">
        {staff.map((s) => (
          <StaffRow key={s.id} staff={s} isSelf={s.id === me.id} />
        ))}
      </div>
    </div>
  );
}
