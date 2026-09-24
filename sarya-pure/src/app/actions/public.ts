"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { email, formToObject, indianPhone, optionalPhone, optionalText, text, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { emails, notifyAdmin, sendEmail } from "@/lib/services/email";

const TOO_MANY: ActionState = { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };

const newsletterSchema = z.object({ name: optionalText(80), email });

export async function subscribeNewsletter(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: zodFieldErrors(parsed.error).email ?? "Please enter a valid email.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!(await rateLimit(`newsletter:${await getClientIp()}`, 5, 600))) return TOO_MANY;
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    update: { isActive: true, unsubscribedAt: null, ...(parsed.data.name ? { name: parsed.data.name } : {}) },
    create: { email: parsed.data.email, name: parsed.data.name },
  });
  return { ok: true, message: "Thank you for joining the Sarya Pure family!" };
}

const contactSchema = z.object({
  name: text(100, 2),
  email,
  phone: optionalPhone,
  subject: text(150, 3),
  message: text(3000, 10),
  website: z.string().max(0, "Spam detected").optional().default(""), // honeypot
});

export async function submitContact(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!(await rateLimit(`contact:${await getClientIp()}`, 5, 900))) return TOO_MANY;
  const { website: _hp, ...data } = parsed.data;
  void _hp;
  await db.contactMessage.create({ data });
  await notifyAdmin(`New contact message: ${data.subject}`, [`From: ${data.name} <${data.email}>`, data.message.slice(0, 500)]);
  return { ok: true, message: "Thanks for reaching out! We'll get back to you soon." };
}

const b2bSchema = z.object({
  name: text(100, 2),
  company: optionalText(150),
  businessType: optionalText(60),
  phone: indianPhone,
  email,
  city: text(80, 2),
  productRequirement: text(1000, 3),
  estimatedQuantity: text(200, 1),
  budget: optionalText(100),
  message: optionalText(3000),
  website: z.string().max(0, "Spam detected").optional().default(""),
});

export async function submitB2BEnquiry(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = b2bSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!(await rateLimit(`b2b:${await getClientIp()}`, 5, 900))) return TOO_MANY;
  const { website: _hp, ...data } = parsed.data;
  void _hp;
  await db.b2BEnquiry.create({ data });
  await sendEmail(emails.b2bAcknowledgement(data.email, data.name));
  await notifyAdmin(`New B2B enquiry from ${data.company ?? data.name}`, [
    `Contact: ${data.name}, ${data.phone}, ${data.email}`,
    `City: ${data.city}`,
    `Requirement: ${data.productRequirement}`,
    `Quantity: ${data.estimatedQuantity}`,
  ]);
  return { ok: true, message: "Thank you! Your enquiry has been received. Our team will contact you shortly." };
}
