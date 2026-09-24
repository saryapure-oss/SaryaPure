"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { audit } from "@/lib/services/audit";
import type { EnquiryStatus } from "@/generated/prisma/enums";

export async function updateB2BStatus(id: string, status: EnquiryStatus, adminNotes?: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("leads:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const enquiry = await db.b2BEnquiry.update({ where: { id }, data: { status, ...(adminNotes !== undefined ? { adminNotes } : {}) } }).catch(() => null);
  if (!enquiry) return { ok: false, message: "Enquiry not found." };
  await audit({ actorId: admin.id, action: "b2b.status", entity: "B2BEnquiry", entityId: id, after: { status } });
  revalidatePath("/admin/b2b");
  return { ok: true, message: "Enquiry updated." };
}

export async function markMessageRead(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("leads:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.contactMessage.update({ where: { id }, data: { isRead: true } }).catch(() => null);
  revalidatePath("/admin/messages");
  return { ok: true, message: "Marked as read." };
}
