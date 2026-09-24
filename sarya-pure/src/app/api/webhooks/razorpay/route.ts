import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/services/razorpay";
import { confirmRazorpayPayment, markPaymentFailed, PaymentVerificationError } from "@/lib/services/orders";

export const runtime = "nodejs";

/**
 * Razorpay webhook. Configure this URL (https://<your-domain>/api/webhooks/razorpay) in the
 * Razorpay dashboard with events: payment.captured, payment.failed, order.paid.
 * The webhook is a safety net — payments are primarily verified via the browser checkout callback.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: { event?: string; payload?: { payment?: { entity?: { id: string; order_id: string; status: string; error_description?: string } } } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventId = req.headers.get("x-razorpay-event-id");
  if (eventId) {
    try {
      await db.processedWebhook.create({ data: { id: eventId, event: payload.event ?? "unknown" } });
    } catch {
      // Already processed — respond 200 so Razorpay stops retrying.
      return NextResponse.json({ ok: true, duplicate: true });
    }
  }

  const payment = payload.payload?.payment?.entity;
  try {
    if (payload.event === "payment.captured" && payment) {
      await confirmRazorpayPayment({ razorpayOrderId: payment.order_id, paymentId: payment.id, source: "webhook" });
    } else if (payload.event === "payment.failed" && payment) {
      await markPaymentFailed(payment.order_id, payment.error_description ?? "Payment failed");
    }
  } catch (e) {
    if (!(e instanceof PaymentVerificationError)) console.error("[webhook] razorpay handling error", e);
  }

  return NextResponse.json({ ok: true });
}
