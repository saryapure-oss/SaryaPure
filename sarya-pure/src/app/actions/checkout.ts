"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { addressSchema, formToObject, id, optionalText, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { assertUser } from "@/lib/auth/guards";
import { getCartView } from "@/lib/services/cart";
import { placeOrder, getRetryPayment, CheckoutError, markPaymentFailed, confirmRazorpayPayment, PaymentVerificationError } from "@/lib/services/orders";
import { randomToken } from "@/lib/security/crypto";
import { rateLimit } from "@/lib/security/rate-limit";
import { publicKeyId } from "@/lib/services/razorpay";

const checkoutSchema = z.object({
  ...addressSchema.shape,
  saveAddress: z.union([z.literal("on"), z.literal("")]).optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  giftMessage: optionalText(300),
  customerNote: optionalText(500),
});

export type PlaceOrderState = ActionState & {
  razorpay?: { orderId: string; amount: number; currency: string; keyId: string; name: string; prefill: { name: string; email: string; contact: string } };
  orderNumber?: string;
};

export async function placeOrderAction(_prev: PlaceOrderState, fd: FormData): Promise<PlaceOrderState> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in to check out." };
  if (!(await rateLimit(`checkout:${user.id}`, 20, 300))) return { ok: false, message: "Too many attempts. Please wait a moment." };

  const raw = formToObject(fd);
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const cart = await getCartView({ pincode: parsed.data.pincode, paymentMethod: parsed.data.paymentMethod });
  if (cart.lines.length === 0) return { ok: false, message: "Your cart is empty." };
  if (cart.hasProblems) return { ok: false, message: "Some items in your cart need attention. Please review your cart." };

  if (parsed.data.saveAddress === "on") {
    const existingDefault = await db.address.findFirst({ where: { userId: user.id, isDefault: true } });
    await db.address.create({
      data: {
        userId: user.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2,
        landmark: parsed.data.landmark,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        isDefault: !existingDefault,
      },
    });
  }

  const idempotencyKey = String(fd.get("idempotencyKey") ?? "") || randomToken(16);

  let result: Awaited<ReturnType<typeof placeOrder>>;
  try {
    result = await placeOrder({
      userId: user.id,
      email: user.email,
      address: parsed.data,
      paymentMethod: parsed.data.paymentMethod,
      idempotencyKey,
      giftMessage: parsed.data.giftMessage,
      customerNote: parsed.data.customerNote,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, message: e.message };
    console.error("[checkout] placeOrder failed", e);
    return { ok: false, message: "Something went wrong while placing your order. Please try again." };
  }

  // redirect() throws internally (NEXT_REDIRECT) and must NOT be caught by the
  // try/catch above, or the navigation is swallowed and treated as an error.
  if (result.paymentMethod === "COD") redirect(`/order-confirmation/${result.orderNumber}`);

  if (result.razorpay) {
    return {
      ok: true,
      orderNumber: result.orderNumber,
      razorpay: {
        ...result.razorpay,
        keyId: publicKeyId(),
        name: "Sarya Pure",
        prefill: { name: parsed.data.fullName, email: user.email, contact: parsed.data.phone },
      },
    };
  }
  return { ok: false, message: "Could not start payment. Please try again." };
}

export async function retryPaymentAction(orderNumber: string): Promise<PlaceOrderState> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in." };
  try {
    const result = await getRetryPayment(orderNumber, user.id);
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber }, select: { customerName: true, email: true, phone: true } });
    return {
      ok: true,
      orderNumber: result.orderNumber,
      razorpay: { ...result.razorpay, keyId: publicKeyId(), name: "Sarya Pure", prefill: { name: order.customerName, email: order.email, contact: order.phone } },
    };
  } catch (e) {
    return { ok: false, message: e instanceof CheckoutError ? e.message : "Could not resume payment." };
  }
}

const verifySchema = z.object({
  razorpay_order_id: id,
  razorpay_payment_id: id,
  razorpay_signature: z.string().min(10).max(200),
});

export async function verifyPaymentAction(input: unknown): Promise<{ ok: boolean; orderNumber?: string; message: string }> {
  const user = await assertUser().catch(() => null);
  if (!user) return { ok: false, message: "Please sign in." };
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid payment response." };
  if (!(await rateLimit(`verify:${user.id}`, 20, 300))) return { ok: false, message: "Too many attempts." };

  try {
    const result = await confirmRazorpayPayment({
      razorpayOrderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      signature: parsed.data.razorpay_signature,
      source: "checkout",
    });
    if (result.stockProblem) return { ok: false, orderNumber: result.orderNumber, message: "Payment received, but an item went out of stock. Our team will contact you about a refund." };
    return { ok: true, orderNumber: result.orderNumber, message: "Payment verified." };
  } catch (e) {
    if (e instanceof PaymentVerificationError) return { ok: false, message: e.message };
    console.error("[checkout] verify failed", e);
    return { ok: false, message: "We could not verify your payment. If money was deducted, it will be refunded automatically." };
  }
}

export async function reportPaymentFailureAction(razorpayOrderId: string, reason: string): Promise<void> {
  const user = await assertUser().catch(() => null);
  if (!user || !id.safeParse(razorpayOrderId).success) return;
  await markPaymentFailed(razorpayOrderId, reason.slice(0, 300), user.id);
}
