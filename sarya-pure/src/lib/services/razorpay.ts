import "server-only";
import { hmacSha256Hex, randomToken, safeEqual } from "@/lib/security/crypto";

/**
 * Minimal, dependency-free Razorpay REST client. Secrets never leave the server.
 * Docs: https://razorpay.com/docs/api/
 */

const API = "https://api.razorpay.com/v1";

function keys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret };
}

/**
 * Local-development mock: skips network calls to Razorpay while still exercising our own
 * signature verification. Only possible with rzp_test_ keys and never in production deployments.
 */
export function isMockMode(): boolean {
  const on = process.env.RAZORPAY_MOCK === "true";
  if (!on) return false;
  const testKey = (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");
  const prodDeploy = process.env.VERCEL_ENV === "production";
  if (!testKey || prodDeploy) {
    console.error("[razorpay] RAZORPAY_MOCK ignored: requires rzp_test_ keys and a non-production deployment");
    return false;
  }
  return true;
}

export function publicKeyId(): string {
  return keys().keyId;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { keyId, keySecret } = keys();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new Error(`Razorpay API error (${res.status}): ${body.error?.description ?? "unknown"}`);
  return body;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string; method?: string };

export async function createRazorpayOrder(input: { amount: number; receipt: string; notes?: Record<string, string> }): Promise<RazorpayOrder> {
  if (isMockMode()) return { id: `order_mock${randomToken(10)}`, amount: input.amount, currency: "INR", receipt: input.receipt, status: "created" };
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: input.amount, currency: "INR", receipt: input.receipt, notes: input.notes ?? {} }),
  });
}

export async function fetchRazorpayPayment(paymentId: string, expected: { orderId: string; amount: number }): Promise<RazorpayPayment> {
  if (isMockMode()) return { id: paymentId, order_id: expected.orderId, amount: expected.amount, currency: "INR", status: "captured" };
  return call<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export async function refundRazorpayPayment(paymentId: string, amount: number): Promise<{ id: string; status: string }> {
  if (isMockMode()) return { id: `rfnd_mock${randomToken(8)}`, status: "processed" };
  return call(`/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", body: JSON.stringify({ amount }) });
}

/** Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = keys();
  return safeEqual(hmacSha256Hex(keySecret, `${orderId}|${paymentId}`), signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(hmacSha256Hex(secret, rawBody), signature);
}
