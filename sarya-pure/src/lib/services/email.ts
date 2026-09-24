import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { escapeHtml } from "@/lib/security/sanitize";
import { formatINR } from "@/lib/money";
import { siteUrl, titleCase } from "@/lib/utils";

/**
 * Email notification layer. Provider = any SMTP server (Amazon SES, Resend SMTP, SendGrid, Zoho, Gmail Workspace...).
 * When SMTP_HOST is not set, emails are logged to the console so development works without credentials.
 */

let transporter: Transporter | null = null;
function getTransport(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

type Mail = { to: string; subject: string; html: string; text: string };

export async function sendEmail(mail: Mail): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.info(`[email:dev] To: ${mail.to} | Subject: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, ...mail });
  } catch (e) {
    // Never fail the user's request because an email could not be delivered.
    console.error("[email] send failed", e);
  }
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;color:#2b2a26">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
  <tr><td style="background:#1f3d2b;padding:20px 28px;color:#f7f2e8;font-size:22px;font-family:Georgia,serif">Sarya Pure</td></tr>
  <tr><td style="padding:28px"><h1 style="font-family:Georgia,serif;font-size:22px;margin:0 0 16px;color:#1f3d2b">${escapeHtml(title)}</h1>${bodyHtml}</td></tr>
  <tr><td style="padding:16px 28px;background:#efe6d6;font-size:12px;color:#6b5d4a">Sarya Pure Pvt Ltd · Pure Goodness. Naturally Premium.</td></tr>
  </table></td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="line-height:1.6;margin:0 0 14px">${s}</p>`;
const btn = (href: string, label: string) =>
  `<p><a href="${escapeHtml(href)}" style="display:inline-block;background:#1f3d2b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${escapeHtml(label)}</a></p>`;

function build(to: string, subject: string, title: string, paragraphs: string[], cta?: { href: string; label: string }): Mail {
  const html = layout(title, paragraphs.map((x) => p(escapeHtml(x))).join("") + (cta ? btn(cta.href, cta.label) : ""));
  const text = [title, "", ...paragraphs, ...(cta ? ["", `${cta.label}: ${cta.href}`] : [])].join("\n");
  return { to, subject, html, text };
}

export const emails = {
  welcome: (to: string, name: string) =>
    build(to, "Welcome to Sarya Pure", `Welcome, ${name}!`, ["Thank you for joining the Sarya Pure family. Explore our premium dry fruits, nuts and gift hampers."], {
      href: siteUrl("/shop"),
      label: "Start shopping",
    }),
  verifyEmail: (to: string, name: string, url: string) =>
    build(to, "Verify your email address", `Hi ${name}, please verify your email`, ["Confirm your email address to secure your account. This link expires in 24 hours."], {
      href: url,
      label: "Verify email",
    }),
  passwordReset: (to: string, url: string) =>
    build(to, "Reset your Sarya Pure password", "Password reset request", [
      "We received a request to reset your password. This link expires in 1 hour.",
      "If you did not request this, you can safely ignore this email.",
    ], { href: url, label: "Reset password" }),
  orderConfirmation: (to: string, o: { orderNumber: string; total: number; paymentMethod: string }) =>
    build(to, `Order ${o.orderNumber} confirmed`, "Thank you for your order!", [
      `Your order ${o.orderNumber} has been confirmed.`,
      `Order total: ${formatINR(o.total)} (${o.paymentMethod === "COD" ? "Cash on Delivery" : "Paid online"}).`,
      "We'll let you know as soon as it ships.",
    ], { href: siteUrl(`/account/orders/${o.orderNumber}`), label: "View order" }),
  paymentConfirmation: (to: string, o: { orderNumber: string; amount: number; paymentId: string }) =>
    build(to, `Payment received for ${o.orderNumber}`, "Payment received", [
      `We have received your payment of ${formatINR(o.amount)} for order ${o.orderNumber}.`,
      `Payment reference: ${o.paymentId}`,
    ]),
  orderStatus: (to: string, o: { orderNumber: string; status: string; trackingNumber?: string | null; courierName?: string | null }) => {
    const label = titleCase(o.status);
    const lines = [`Your order ${o.orderNumber} is now: ${label}.`];
    if (o.status === "SHIPPED" && o.trackingNumber) lines.push(`Courier: ${o.courierName ?? "—"} · Tracking number: ${o.trackingNumber}`);
    if (o.status === "OUT_FOR_DELIVERY") lines.push("Your order will be delivered today. Please keep your phone handy.");
    if (o.status === "DELIVERED") lines.push("We hope you enjoy your Sarya Pure goodies! We'd love to hear your feedback in a review.");
    if (o.status === "CANCELLED") lines.push("If you paid online, any applicable refund will be processed as per our refund policy.");
    if (o.status === "REFUND_INITIATED") lines.push("Your refund has been initiated. It usually reflects in 5–7 business days depending on your bank.");
    if (o.status === "REFUNDED") lines.push("Your refund has been processed.");
    return build(to, `Order ${o.orderNumber}: ${label}`, `Order update: ${label}`, lines, { href: siteUrl(`/account/orders/${o.orderNumber}`), label: "Track order" });
  },
  b2bAcknowledgement: (to: string, name: string) =>
    build(to, "We received your bulk enquiry", `Thank you, ${name}`, [
      "We have received your bulk/corporate enquiry. Our team will review your requirement and get back to you shortly.",
    ]),
  adminNotification: (subject: string, lines: string[]) => {
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    return to ? build(to, `[Admin] ${subject}`, subject, lines, { href: siteUrl("/admin"), label: "Open admin" }) : null;
  },
};

export async function notifyAdmin(subject: string, lines: string[]) {
  const mail = emails.adminNotification(subject, lines);
  if (mail) await sendEmail(mail);
}
