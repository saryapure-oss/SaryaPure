"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { audit } from "@/lib/services/audit";
import { email, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";

const grantSchema = z.object({
  email,
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

/**
 * Grants admin access to an EXISTING registered account (found by email). Staff accounts are never
 * created passwordless from here — the person must already have registered on the storefront with
 * this email, so their password stays something only they know.
 */
export async function grantAdminAccess(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("users:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };

  const parsed = grantSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const target = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!target) {
    return { ok: false, message: "No account found with that email. Ask them to register on the storefront first, then grant access here." };
  }
  if (target.role === parsed.data.role) return { ok: false, message: `${target.email} already has the ${parsed.data.role} role.` };

  await db.user.update({ where: { id: target.id }, data: { role: parsed.data.role } });
  await audit({ actorId: admin.id, action: "user.role_grant", entity: "User", entityId: target.id, before: { role: target.role }, after: { role: parsed.data.role } });
  revalidatePath("/admin/users");
  return { ok: true, message: `${target.email} is now ${parsed.data.role === "SUPER_ADMIN" ? "a Super Admin" : "an Admin"}.` };
}

export async function updateStaffRole(userId: string, role: "ADMIN" | "SUPER_ADMIN"): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("users:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  if (userId === admin.id) return { ok: false, message: "You cannot change your own role." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || !["ADMIN", "SUPER_ADMIN"].includes(target.role)) return { ok: false, message: "Staff member not found." };

  await db.user.update({ where: { id: userId }, data: { role } });
  await audit({ actorId: admin.id, action: "user.role_change", entity: "User", entityId: userId, before: { role: target.role }, after: { role } });
  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated." };
}

export async function setStaffActive(userId: string, isActive: boolean): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("users:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  if (userId === admin.id) return { ok: false, message: "You cannot deactivate your own account." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || !["ADMIN", "SUPER_ADMIN"].includes(target.role)) return { ok: false, message: "Staff member not found." };

  await db.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) await db.session.deleteMany({ where: { userId } }); // force logout immediately
  await audit({ actorId: admin.id, action: isActive ? "user.reactivate" : "user.deactivate", entity: "User", entityId: userId });
  revalidatePath("/admin/users");
  return { ok: true, message: isActive ? "Account reactivated." : "Account deactivated and signed out." };
}

export async function revokeAdminAccess(userId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("users:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  if (userId === admin.id) return { ok: false, message: "You cannot remove your own admin access." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || !["ADMIN", "SUPER_ADMIN"].includes(target.role)) return { ok: false, message: "Staff member not found." };

  await db.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } });
  await db.session.deleteMany({ where: { userId } });
  await audit({ actorId: admin.id, action: "user.role_revoke", entity: "User", entityId: userId, before: { role: target.role }, after: { role: "CUSTOMER" } });
  revalidatePath("/admin/users");
  return { ok: true, message: "Admin access removed." };
}
