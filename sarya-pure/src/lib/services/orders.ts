import "server-only";
import { randomInt } from "node:crypto";
import { db, type Tx } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";
import { calculatePricing } from "@/lib/pricing";
import { getSettings, isRazorpayConfigured } from "@/lib/settings";
import type { AddressInput } from "@/lib/validation/common";
import { quoteShipping } from "./shipping";
import { lookupCoupon } from "./coupons";
import {
  commitReservedStock,
  deductStock,
  OutOfStockError,
  releaseReservedStock,
  reserveStock,
  restock,
  syncProductsForVariants,
} from "./inventory";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  refundRazorpayPayment,
  verifyCheckoutSignature,
} from "./razorpay";
import { emails, notifyAdmin, sendEmail } from "./email";
import { track } from "./analytics";
import { audit } from "./audit";
import { formatINR } from "@/lib/money";

export class CheckoutError extends Error {}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateOrderNumber(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  let r = "";
  for (let i = 0; i < 5; i++) r += ALPHABET[randomInt(ALPHABET.length)];
  return `SP${d}${r}`;
}

export type PlaceOrderInput = {
  userId: string;
  email: string;
  address: AddressInput;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  giftMessage: string | null;
  customerNote: string | null;
};

export type PlaceOrderResult = {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  razorpay?: { orderId: string; amount: number; currency: string };
};

async function existingOrderResult(idempotencyKey: string, userId: string): Promise<PlaceOrderResult | null> {
  const existing = await db.order.findUnique({
    where: { idempotencyKey },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!existing || existing.userId !== userId) return null;
  const pay = existing.payments[0];
  return {
    orderNumber: existing.orderNumber,
    paymentMethod: existing.paymentMethod,
    razorpay:
      existing.paymentMethod === "RAZORPAY" && existing.paymentStatus !== "PAID" && pay?.providerOrderId
        ? { orderId: pay.providerOrderId, amount: pay.amount, currency: "INR" }
        : undefined,
  };
}

/**
 * Creates an order from the user's server-side cart.
 * Every amount is recalculated here from the database; the browser only ever supplies
 * the address, payment method and an idempotency key.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const dup = await existingOrderResult(input.idempotencyKey, input.userId);
  if (dup) return dup;

  await releaseExpiredOrders().catch((e) => console.error("[orders] release expired failed", e));

  const settings = await getSettings();
  const commerce = settings.commerce;
  if (input.paymentMethod === "RAZORPAY" && (!settings.payment.razorpayEnabled || !isRazorpayConfigured())) {
    throw new CheckoutError("Online payment is currently unavailable. Please choose another payment method.");
  }
  const shippingQuote = await quoteShipping(input.address.pincode, commerce);
  if (!shippingQuote.serviceable) throw new CheckoutError("Sorry, we do not deliver to this PIN code yet.");

  let created: { id: string; orderNumber: string; total: number };
  try {
    created = await db.$transaction(
      async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId: input.userId },
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: { select: { id: true, name: true, categoryId: true, taxRate: true, isPublished: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
                  },
                },
              },
            },
          },
        });
        if (!cart || cart.items.length === 0) throw new CheckoutError("Your cart is empty.");
        for (const item of cart.items) {
          if (!item.variant.isActive || !item.variant.product.isPublished) {
            throw new CheckoutError(`${item.variant.product.name} (${item.variant.name}) is no longer available. Please remove it from your cart.`);
          }
          if (item.quantity < 1 || item.quantity > commerce.maxQtyPerItem) throw new CheckoutError("Invalid quantity in cart.");
        }

        let coupon = null;
        if (cart.couponCode) {
          const res = await lookupCoupon(cart.couponCode, { userId: input.userId, email: input.email }, tx);
          if (!res.ok) throw new CheckoutError(res.error);
          coupon = res.coupon;
        }

        const codFee = input.paymentMethod === "COD" ? commerce.codFee : 0;
        const pricing = calculatePricing({
          lines: cart.items.map((i) => ({
            variantId: i.variantId,
            productId: i.variant.product.id,
            categoryId: i.variant.product.categoryId,
            unitPrice: i.variant.price,
            quantity: i.quantity,
            taxRate: Number(i.variant.product.taxRate),
          })),
          coupon,
          shipping: { rate: shippingQuote.rate, freeAbove: shippingQuote.freeAbove, serviceable: true },
          codFee,
          pricesIncludeTax: commerce.pricesIncludeTax,
        });
        if (coupon && pricing.couponError) throw new CheckoutError(pricing.couponError);
        if (pricing.total <= 0) throw new CheckoutError("Invalid order total.");
        if (input.paymentMethod === "COD") {
          if (!shippingQuote.codAvailable) throw new CheckoutError("Cash on Delivery is not available for this PIN code.");
          if (commerce.codMaxOrderValue > 0 && pricing.total > commerce.codMaxOrderValue) {
            throw new CheckoutError(`Cash on Delivery is available for orders up to ${formatINR(commerce.codMaxOrderValue)}.`);
          }
        }

        // Inventory: atomic conditional updates prevent overselling under concurrency.
        for (const item of cart.items) await reserveStock(tx, item.variantId, item.quantity);

        if (coupon) {
          const n = await tx.$executeRaw`
            UPDATE "Coupon" SET "usedCount" = "usedCount" + 1
            WHERE "id" = ${coupon.id} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
          if (n !== 1) throw new CheckoutError("This coupon has reached its usage limit.");
        }

        const isCod = input.paymentMethod === "COD";
        const now = new Date();
        const a = input.address;
        let orderNumber = generateOrderNumber(now);
        while (await tx.order.findUnique({ where: { orderNumber }, select: { id: true } })) orderNumber = generateOrderNumber(now);

        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            status: isCod ? "CONFIRMED" : "PENDING",
            paymentStatus: "PENDING",
            paymentMethod: input.paymentMethod,
            customerName: a.fullName,
            email: input.email,
            phone: a.phone,
            shipLine1: a.line1,
            shipLine2: a.line2,
            shipLandmark: a.landmark,
            shipCity: a.city,
            shipState: a.state,
            shipPincode: a.pincode,
            shipCountry: "India",
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            shipping: pricing.shipping,
            codFee: pricing.codFee,
            tax: pricing.tax,
            total: pricing.total,
            pricesIncludeTax: commerce.pricesIncludeTax,
            couponId: coupon?.id ?? null,
            couponCode: coupon?.code ?? null,
            giftMessage: input.giftMessage,
            customerNote: input.customerNote,
            estimatedDelivery: `${shippingQuote.etaMinDays}–${shippingQuote.etaMaxDays} business days`,
            confirmedAt: isCod ? now : null,
            reservationExpiresAt: isCod ? null : new Date(now.getTime() + commerce.reservationMinutes * 60_000),
            items: {
              create: pricing.lines.map((l) => {
                const item = cart.items.find((i) => i.variantId === l.variantId)!;
                return {
                  productId: l.productId,
                  variantId: l.variantId,
                  productName: item.variant.product.name,
                  variantName: item.variant.name,
                  sku: item.variant.sku,
                  image: item.variant.product.images[0]?.url ?? null,
                  unitPrice: l.unitPrice,
                  mrp: item.variant.mrp,
                  quantity: l.quantity,
                  taxRate: new Prisma.Decimal(l.taxRate),
                  discount: l.discount,
                  tax: l.tax,
                  lineTotal: l.lineTotal,
                };
              }),
            },
            history: {
              create: [
                { status: "PENDING", note: "Order placed" },
                ...(isCod ? [{ status: "CONFIRMED" as const, note: "Cash on Delivery order confirmed" }] : []),
              ],
            },
            payments: { create: isCod ? [{ method: "COD" as const, amount: pricing.total, status: "PENDING" as const }] : [] },
          },
        });

        if (coupon) {
          await tx.couponUsage.create({ data: { couponId: coupon.id, userId: input.userId, orderId: order.id, email: input.email, discount: pricing.discount } });
        }

        if (isCod) {
          for (const item of cart.items) await commitReservedStock(tx, item.variantId, item.quantity);
          await tx.order.update({ where: { id: order.id }, data: { stockCommitted: true } });
          for (const l of pricing.lines) await tx.product.update({ where: { id: l.productId }, data: { soldCount: { increment: l.quantity } } });
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
        }
        await syncProductsForVariants(cart.items.map((i) => i.variantId), tx);
        return { id: order.id, orderNumber: order.orderNumber, total: order.total };
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await existingOrderResult(input.idempotencyKey, input.userId);
      if (again) return again;
    }
    if (e instanceof OutOfStockError) throw new CheckoutError(e.message);
    throw e;
  }

  if (input.paymentMethod === "COD") {
    await afterConfirmed(created.id);
    return { orderNumber: created.orderNumber, paymentMethod: "COD" };
  }

  // Online payment: create the Razorpay order for the server-computed amount.
  try {
    const rp = await createRazorpayOrder({ amount: created.total, receipt: created.orderNumber, notes: { orderNumber: created.orderNumber } });
    if (rp.amount !== created.total) throw new Error("Razorpay amount mismatch");
    await db.payment.create({ data: { orderId: created.id, method: "RAZORPAY", amount: created.total, providerOrderId: rp.id, status: "PENDING" } });
    await track("payment_started", { meta: { method: "RAZORPAY" } });
    return { orderNumber: created.orderNumber, paymentMethod: "RAZORPAY", razorpay: { orderId: rp.id, amount: rp.amount, currency: "INR" } };
  } catch (e) {
    console.error("[orders] failed to create Razorpay order", e);
    await cancelUnpaidOrder(created.id, "Payment gateway unavailable");
    throw new CheckoutError("We could not start the payment. Please try again in a moment.");
  }
}

/** Retry payment for an existing unpaid order owned by the user. */
export async function getRetryPayment(orderNumber: string, userId: string) {
  const order = await db.order.findUnique({ where: { orderNumber }, include: { payments: { orderBy: { createdAt: "desc" } } } });
  if (!order || order.userId !== userId) throw new CheckoutError("Order not found.");
  if (order.paymentMethod !== "RAZORPAY" || order.paymentStatus === "PAID") throw new CheckoutError("This order does not need payment.");
  if (order.status !== "PENDING" || order.stockReleased || (order.reservationExpiresAt && order.reservationExpiresAt < new Date())) {
    throw new CheckoutError("This order has expired. Please place a new order.");
  }
  const pay = order.payments.find((p) => p.providerOrderId);
  if (!pay?.providerOrderId) throw new CheckoutError("Payment could not be resumed.");
  return { orderNumber: order.orderNumber, razorpay: { orderId: pay.providerOrderId, amount: pay.amount, currency: "INR" } };
}

async function cancelUnpaidOrder(orderId: string, reason: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true, couponUsage: true } });
    if (!order || order.stockReleased || order.stockCommitted || order.paymentStatus === "PAID") return;
    const n = await tx.order.updateMany({ where: { id: orderId, stockReleased: false, stockCommitted: false }, data: { stockReleased: true, status: "CANCELLED", cancelledAt: new Date() } });
    if (n.count !== 1) return;
    for (const i of order.items) if (i.variantId) await releaseReservedStock(tx, i.variantId, i.quantity);
    if (order.couponUsage) {
      await tx.couponUsage.delete({ where: { id: order.couponUsage.id } });
      await tx.coupon.update({ where: { id: order.couponUsage.couponId }, data: { usedCount: { decrement: 1 } } });
    }
    await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note: reason } });
    await syncProductsForVariants(order.items.flatMap((i) => (i.variantId ? [i.variantId] : [])), tx);
  });
}

/** Releases stock held by unpaid online orders whose reservation window has passed. Safe to call often. */
export async function releaseExpiredOrders(): Promise<number> {
  const expired = await db.order.findMany({
    where: { status: "PENDING", paymentMethod: "RAZORPAY", paymentStatus: { not: "PAID" }, stockReleased: false, reservationExpiresAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const o of expired) await cancelUnpaidOrder(o.id, "Payment not completed in time — order expired");
  return expired.length;
}

export class PaymentVerificationError extends Error {}

/**
 * Verifies a Razorpay payment and confirms the order. Idempotent — safe to call from both the
 * browser callback and the webhook.
 */
export async function confirmRazorpayPayment(params: { razorpayOrderId: string; paymentId: string; signature?: string; source: "checkout" | "webhook" }) {
  if (params.source === "checkout") {
    if (!params.signature || !verifyCheckoutSignature(params.razorpayOrderId, params.paymentId, params.signature)) {
      throw new PaymentVerificationError("Payment signature verification failed.");
    }
  }
  const payment = await db.payment.findUnique({ where: { providerOrderId: params.razorpayOrderId }, include: { order: true } });
  if (!payment) throw new PaymentVerificationError("Unknown payment order.");
  if (payment.status === "PAID") return { orderNumber: payment.order.orderNumber, alreadyProcessed: true };

  const remote = await fetchRazorpayPayment(params.paymentId, { orderId: params.razorpayOrderId, amount: payment.amount });
  if (remote.order_id !== params.razorpayOrderId) throw new PaymentVerificationError("Payment does not belong to this order.");
  if (remote.amount !== payment.amount || remote.currency !== "INR") throw new PaymentVerificationError("Payment amount mismatch.");
  if (!["captured", "authorized"].includes(remote.status)) throw new PaymentVerificationError(`Payment is ${remote.status}.`);

  const result = await db.$transaction(async (tx) => {
    // Conditional update is the idempotency guard against duplicate callbacks/webhooks.
    const upd = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID", providerPaymentId: params.paymentId, providerSignature: params.signature ?? null, raw: remote as unknown as Prisma.InputJsonValue },
    });
    if (upd.count !== 1) return { processed: false, stockProblem: false };

    const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId }, include: { items: true } });
    let stockProblem = false;
    if (!order.stockCommitted) {
      try {
        for (const i of order.items) {
          if (!i.variantId) continue;
          if (order.stockReleased) await deductStock(tx, i.variantId, i.quantity);
          else await commitReservedStock(tx, i.variantId, i.quantity);
        }
      } catch (e) {
        if (!(e instanceof OutOfStockError)) throw e;
        stockProblem = true;
      }
    }
    if (stockProblem) {
      // Paid after the reservation expired and stock ran out: never oversell — flag for refund.
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CANCELLED", cancelledAt: new Date(), adminNote: "Payment received after reservation expired and stock was unavailable. Refund required." },
      });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: "Item(s) out of stock at payment time — refund will be issued" } });
      return { processed: true, stockProblem };
    }
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: order.status === "PENDING" || order.status === "CANCELLED" ? "CONFIRMED" : order.status, stockCommitted: true, stockReleased: false, confirmedAt: new Date(), cancelledAt: null },
    });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CONFIRMED", note: "Payment verified" } });
    for (const i of order.items) if (i.productId) await tx.product.update({ where: { id: i.productId }, data: { soldCount: { increment: i.quantity } } });
    if (order.userId) {
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id, variantId: { in: order.items.flatMap((i) => (i.variantId ? [i.variantId] : [])) } } });
        await tx.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
      }
    }
    await syncProductsForVariants(order.items.flatMap((i) => (i.variantId ? [i.variantId] : [])), tx);
    return { processed: true, stockProblem };
  });

  if (result.processed) {
    if (result.stockProblem) {
      await notifyAdmin(`Refund needed for ${payment.order.orderNumber}`, ["Payment was received after the stock reservation expired and stock was unavailable."]);
    } else {
      await sendEmail(emails.paymentConfirmation(payment.order.email, { orderNumber: payment.order.orderNumber, amount: payment.amount, paymentId: params.paymentId }));
      await afterConfirmed(payment.orderId);
    }
  }
  return { orderNumber: payment.order.orderNumber, alreadyProcessed: !result.processed, stockProblem: result.stockProblem };
}

export async function markPaymentFailed(razorpayOrderId: string, reason: string, userId?: string) {
  const payment = await db.payment.findUnique({ where: { providerOrderId: razorpayOrderId }, include: { order: true } });
  if (!payment || payment.status === "PAID") return null;
  if (userId && payment.order.userId !== userId) return null;
  await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: reason.slice(0, 500) } });
  await db.order.updateMany({ where: { id: payment.orderId, paymentStatus: { not: "PAID" } }, data: { paymentStatus: "FAILED" } });
  return payment.order.orderNumber;
}

async function afterConfirmed(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  await sendEmail(emails.orderConfirmation(order.email, { orderNumber: order.orderNumber, total: order.total, paymentMethod: order.paymentMethod }));
  await notifyAdmin(`New order ${order.orderNumber}`, [`Total: ${formatINR(order.total)}`, `Payment: ${order.paymentMethod}`, `Items: ${order.items.length}`]);
  await track("purchase", { meta: { value: order.total, method: order.paymentMethod, items: order.items.length } });
  if (order.couponCode) await track("coupon_applied", { meta: { code: order.couponCode, stage: "purchase" } });
}

// ───────────────────────────── Status management ─────────────────────────────

export const STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "PACKED", "SHIPPED", "CANCELLED"],
  PROCESSING: ["PACKED", "SHIPPED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "SHIPPED"],
  DELIVERED: ["REFUND_INITIATED"],
  CANCELLED: ["REFUND_INITIATED"],
  REFUND_INITIATED: ["REFUNDED"],
  REFUNDED: [],
};

export function allowedNextStatuses(current: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[current];
}

export async function updateOrderStatus(params: {
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  actorId: string;
}) {
  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order) throw new CheckoutError("Order not found.");
  if (params.status === "CANCELLED") return cancelOrder({ orderId: order.id, actorId: params.actorId, reason: params.note ?? "Cancelled by admin", byCustomer: false });
  if (!ALLOWED_TRANSITIONS[order.status].includes(params.status)) {
    throw new CheckoutError(`Cannot change status from ${order.status} to ${params.status}.`);
  }
  if (params.status === "CONFIRMED" && order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID") {
    throw new CheckoutError("Online orders are confirmed automatically once payment is verified.");
  }
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: params.status,
        trackingNumber: params.trackingNumber ?? order.trackingNumber,
        courierName: params.courierName ?? order.courierName,
        deliveredAt: params.status === "DELIVERED" ? now : order.deliveredAt,
        // Cash collected on delivery
        paymentStatus: params.status === "DELIVERED" && order.paymentMethod === "COD" ? "PAID" : undefined,
      },
    });
    if (params.status === "DELIVERED" && order.paymentMethod === "COD") {
      await tx.payment.updateMany({ where: { orderId: order.id, method: "COD" }, data: { status: "PAID" } });
    }
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: params.status, note: params.note ?? null, actorId: params.actorId } });
  });
  await audit({ actorId: params.actorId, action: "order.status", entity: "Order", entityId: order.id, before: { status: order.status }, after: { status: params.status, note: params.note } });
  await sendEmail(emails.orderStatus(order.email, { orderNumber: order.orderNumber, status: params.status, trackingNumber: params.trackingNumber, courierName: params.courierName }));
}

export async function cancelOrder(params: { orderId: string; actorId: string | null; reason: string; byCustomer: boolean }) {
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { items: true, couponUsage: true } });
  if (!order) throw new CheckoutError("Order not found.");
  const cancellable: OrderStatus[] = params.byCustomer ? ["PENDING", "CONFIRMED", "PROCESSING"] : ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"];
  if (!cancellable.includes(order.status)) throw new CheckoutError("This order can no longer be cancelled.");

  await db.$transaction(async (tx) => {
    const n = await tx.order.updateMany({ where: { id: order.id, status: order.status }, data: { status: "CANCELLED", cancelledAt: new Date() } });
    if (n.count !== 1) throw new CheckoutError("Order was updated by someone else. Please refresh.");
    for (const i of order.items) {
      if (!i.variantId) continue;
      if (order.stockCommitted) await restock(tx, i.variantId, i.quantity);
      else if (!order.stockReleased) await releaseReservedStock(tx, i.variantId, i.quantity);
    }
    if (order.stockCommitted) {
      for (const i of order.items) if (i.productId) await tx.product.update({ where: { id: i.productId }, data: { soldCount: { decrement: i.quantity } } });
    }
    await tx.order.update({ where: { id: order.id }, data: { stockCommitted: false, stockReleased: true } });
    if (order.couponUsage) {
      await tx.couponUsage.delete({ where: { id: order.couponUsage.id } });
      await tx.coupon.update({ where: { id: order.couponUsage.couponId }, data: { usedCount: { decrement: 1 } } });
    }
    if (order.paymentMethod === "COD") await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "FAILED", failureReason: "Order cancelled" } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: params.reason, actorId: params.actorId } });
    await syncProductsForVariants(order.items.flatMap((i) => (i.variantId ? [i.variantId] : [])), tx);
  });
  if (params.actorId && !params.byCustomer) {
    await audit({ actorId: params.actorId, action: "order.cancel", entity: "Order", entityId: order.id, before: { status: order.status }, after: { status: "CANCELLED", reason: params.reason } });
  }
  await sendEmail(emails.orderStatus(order.email, { orderNumber: order.orderNumber, status: "CANCELLED" }));
}

/** Refund a paid order (full or partial). Online payments are refunded through Razorpay; COD refunds are recorded as manual. */
export async function refundOrder(params: { orderId: string; amount: number; actorId: string; note?: string | null }) {
  const order = await db.order.findUnique({ where: { id: params.orderId }, include: { payments: { where: { status: { in: ["PAID", "PARTIALLY_REFUNDED"] } } } } });
  if (!order) throw new CheckoutError("Order not found.");
  const payment = order.payments[0];
  if (!payment) throw new CheckoutError("There is no captured payment to refund.");
  const refundable = payment.amount - payment.refundedAmount;
  if (params.amount <= 0 || params.amount > refundable) throw new CheckoutError(`Refund amount must be between ₹0.01 and ${formatINR(refundable)}.`);

  let providerStatus = "manual";
  if (payment.method === "RAZORPAY") {
    if (!payment.providerPaymentId) throw new CheckoutError("Missing Razorpay payment id.");
    const r = await refundRazorpayPayment(payment.providerPaymentId, params.amount);
    providerStatus = r.status;
  }
  const newRefunded = payment.refundedAmount + params.amount;
  const full = newRefunded >= payment.amount;
  const orderStatus: OrderStatus = full && (providerStatus === "processed" || providerStatus === "manual") ? "REFUNDED" : "REFUND_INITIATED";
  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { refundedAmount: newRefunded, status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED", status: orderStatus } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status: orderStatus, note: `Refund of ${formatINR(params.amount)}${params.note ? ` — ${params.note}` : ""}`, actorId: params.actorId } });
  });
  await audit({ actorId: params.actorId, action: "order.refund", entity: "Order", entityId: order.id, after: { amount: params.amount, providerStatus, full } });
  await sendEmail(emails.orderStatus(order.email, { orderNumber: order.orderNumber, status: orderStatus }));
}

export async function hasPurchased(userId: string, productId: string, client: Tx | typeof db = db): Promise<boolean> {
  const n = await client.orderItem.count({
    where: { productId, order: { userId, paymentStatus: "PAID", status: { notIn: ["CANCELLED", "REFUNDED"] } } },
  });
  if (n > 0) return true;
  // COD orders count as purchased once delivered
  const cod = await client.orderItem.count({ where: { productId, order: { userId, status: "DELIVERED" } } });
  return cod > 0;
}
