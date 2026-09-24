"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/guards";
import { updateOrderStatus, cancelOrder, refundOrder, CheckoutError } from "@/lib/services/orders";
import { db } from "@/lib/db";
import { optionalText, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
  note: optionalText(300),
  trackingNumber: optionalText(80),
  courierName: optionalText(80),
});

export async function changeOrderStatus(orderId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("orders:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = statusSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  try {
    await updateOrderStatus({
      orderId,
      status: parsed.data.status,
      note: parsed.data.note,
      trackingNumber: parsed.data.trackingNumber,
      courierName: parsed.data.courierName,
      actorId: admin.id,
    });
  } catch (e) {
    return { ok: false, message: e instanceof CheckoutError ? e.message : "Could not update order status." };
  }
  revalidatePath("/admin/orders");
  return { ok: true, message: "Order updated." };
}

export async function adminCancelOrder(orderId: string, reason: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("orders:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  try {
    await cancelOrder({ orderId, actorId: admin.id, reason: reason || "Cancelled by admin", byCustomer: false });
  } catch (e) {
    return { ok: false, message: e instanceof CheckoutError ? e.message : "Could not cancel order." };
  }
  revalidatePath("/admin/orders");
  return { ok: true, message: "Order cancelled." };
}

const refundSchema = z.object({
  amount: z.coerce.number().int().min(1),
  note: optionalText(300),
});

export async function adminRefundOrder(orderId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await assertPermission("orders:refund").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  const parsed = refundSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Enter a valid refund amount.", fieldErrors: zodFieldErrors(parsed.error) };
  try {
    await refundOrder({ orderId, amount: parsed.data.amount, actorId: admin.id, note: parsed.data.note });
  } catch (e) {
    return { ok: false, message: e instanceof CheckoutError ? e.message : "Could not process refund." };
  }
  revalidatePath("/admin/orders");
  return { ok: true, message: "Refund processed." };
}

export async function updateAdminNote(orderId: string, note: string): Promise<{ ok: boolean; message: string }> {
  const admin = await assertPermission("orders:manage").catch(() => null);
  if (!admin) return { ok: false, message: "Not authorized." };
  await db.order.update({ where: { id: orderId }, data: { adminNote: note.slice(0, 2000) } });
  revalidatePath("/admin/orders");
  return { ok: true, message: "Note saved." };
}
