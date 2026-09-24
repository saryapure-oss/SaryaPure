"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/auth/guards";
import { addressSchema, formToObject, id, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { cancelOrder, CheckoutError } from "@/lib/services/orders";

export async function cancelMyOrder(orderNumber: string, reason: string): Promise<{ ok: boolean; message: string }> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in." };
  const order = await db.order.findFirst({ where: { orderNumber, userId: user.id } });
  if (!order) return { ok: false, message: "Order not found." };
  try {
    await cancelOrder({ orderId: order.id, actorId: user.id, reason: reason.slice(0, 300) || "Cancelled by customer", byCustomer: true });
    revalidatePath(`/account/orders/${orderNumber}`);
    revalidatePath("/account/orders");
    return { ok: true, message: "Your order has been cancelled." };
  } catch (e) {
    return { ok: false, message: e instanceof CheckoutError ? e.message : "Could not cancel this order." };
  }
}

const addAddressSchema = addressSchema;

export async function addAddress(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in." };
  const parsed = addAddressSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  const count = await db.address.count({ where: { userId: user.id } });
  await db.address.create({ data: { ...parsed.data, userId: user.id, isDefault: count === 0 } });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function updateAddress(addressId: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in." };
  if (!id.safeParse(addressId).success) return { ok: false, message: "Invalid address." };
  const owned = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!owned) return { ok: false, message: "Address not found." };
  const parsed = addAddressSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  await db.address.update({ where: { id: addressId }, data: parsed.data });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address updated." };
}

export async function deleteAddress(addressId: string): Promise<{ ok: boolean; message: string }> {
  const user = await assertUser().catch(() => null);
  if (!user || !id.safeParse(addressId).success) return { ok: false, message: "Not allowed." };
  await db.address.deleteMany({ where: { id: addressId, userId: user.id } });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address removed." };
}

export async function setDefaultAddress(addressId: string): Promise<{ ok: boolean; message: string }> {
  const user = await assertUser().catch(() => null);
  if (!user || !id.safeParse(addressId).success) return { ok: false, message: "Not allowed." };
  const owned = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
  if (!owned) return { ok: false, message: "Address not found." };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true, message: "Default address updated." };
}

const trackSchema = z.object({ orderNumber: z.string().trim().toUpperCase().max(20), email: z.string().trim().toLowerCase().email() });

export async function trackOrderPublic(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = trackSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please enter a valid order number and email." };
  const order = await db.order.findFirst({ where: { orderNumber: parsed.data.orderNumber, email: parsed.data.email } });
  if (!order) return { ok: false, message: "We couldn't find an order with that number and email." };
  return { ok: true, message: "", data: { orderNumber: order.orderNumber } };
}
