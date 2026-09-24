"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { email, password, text, formToObject, zodFieldErrors, type ActionState } from "@/lib/validation/common";
import { safeRedirectPath } from "@/lib/utils";
import { hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser, SESSION_COOKIE } from "@/lib/auth/session";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { rateLimit, assertRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { mergeGuestCart } from "@/lib/services/cart";
import { emails, sendEmail } from "@/lib/services/email";
import { siteUrl } from "@/lib/utils";
import { audit } from "@/lib/services/audit";

const TOO_MANY: ActionState = { ok: false, message: "Too many attempts. Please wait a few minutes and try again." };

// ───────────────────────────── Register ─────────────────────────────

const registerSchema = z
  .object({
    name: text(100, 2),
    email,
    password,
    confirmPassword: z.string(),
    next: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export async function registerAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  if (!(await rateLimit(`register:${ip}`, 10, 3600))) return TOO_MANY;

  const parsed = registerSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { ok: false, message: "An account with this email already exists.", fieldErrors: { email: "An account with this email already exists." } };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash, role: "CUSTOMER" } });

  await sendEmail(emails.welcome(user.email, user.name));
  await issueVerificationEmail(user.id, user.email, user.name);
  await createSession(user.id);
  await mergeGuestCart(user.id);

  redirect(safeRedirectPath(parsed.data.next, "/account"));
}

// ───────────────────────────── Login / Logout ─────────────────────────────

const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password"), next: z.string().optional() });

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = await getClientIp();
  const parsed = loginSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Enter a valid email and password.", fieldErrors: zodFieldErrors(parsed.error) };

  if (!(await rateLimit(`login:${ip}`, 10, 300)) || !(await rateLimit(`login-email:${parsed.data.email}`, 8, 900))) return TOO_MANY;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Always run a bcrypt compare (against a dummy hash when the user doesn't exist) so response timing does not reveal account existence.
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { ok: false, message: "Incorrect email or password.", fieldErrors: { _form: "Incorrect email or password." } };
  if (!user.isActive) return { ok: false, message: "This account has been deactivated. Please contact support." };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  await mergeGuestCart(user.id);
  if (user.role !== "CUSTOMER") await audit({ actorId: user.id, action: "admin.login", entity: "User", entityId: user.id });

  redirect(safeRedirectPath(parsed.data.next, user.role === "CUSTOMER" ? "/account" : "/admin"));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ───────────────────────────── Email verification ─────────────────────────────

async function issueVerificationEmail(userId: string, email: string, name: string) {
  const token = randomToken(32);
  await db.verificationToken.create({ data: { userId, tokenHash: sha256(token), type: "EMAIL_VERIFICATION", expiresAt: new Date(Date.now() + 24 * 3600_000) } });
  await sendEmail(emails.verifyEmail(email, name, siteUrl(`/verify-email?token=${token}`)));
}

export async function resendVerificationEmail(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  if (user.emailVerified) return { ok: true, message: "Your email is already verified." };
  if (!(await rateLimit(`verify-resend:${user.id}`, 5, 900))) return TOO_MANY;
  await issueVerificationEmail(user.id, user.email, user.name);
  return { ok: true, message: "Verification email sent. Please check your inbox." };
}

export async function verifyEmailToken(token: string): Promise<{ ok: boolean; message: string }> {
  if (!token || token.length > 100) return { ok: false, message: "Invalid or expired verification link." };
  const record = await db.verificationToken.findUnique({ where: { tokenHash: sha256(token) } });
  if (!record || record.type !== "EMAIL_VERIFICATION" || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This verification link is invalid or has expired. Please request a new one." };
  }
  await db.$transaction([
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
  ]);
  return { ok: true, message: "Your email has been verified. Thank you!" };
}

// ───────────────────────────── Password reset ─────────────────────────────

const forgotSchema = z.object({ email });

export async function forgotPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const generic: ActionState = { ok: true, message: "If an account exists for that email, we've sent a password reset link." };
  const parsed = forgotSchema.safeParse(formToObject(fd));
  if (!parsed.success) return generic;
  if (!(await assertRateLimit(`forgot:${await getClientIp()}`, 8, 900).then(() => true).catch(() => false))) return TOO_MANY;

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomToken(32);
    await db.verificationToken.create({ data: { userId: user.id, tokenHash: sha256(token), type: "PASSWORD_RESET", expiresAt: new Date(Date.now() + 3600_000) } });
    await sendEmail(emails.passwordReset(user.email, siteUrl(`/reset-password?token=${token}`)));
  }
  return generic;
}

const resetSchema = z
  .object({ token: z.string().min(10).max(100), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export async function resetPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!(await rateLimit(`reset:${await getClientIp()}`, 10, 900))) return TOO_MANY;

  const record = await db.verificationToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, message: "This reset link is invalid or has expired. Please request a new one." };
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: record.userId } }), // Invalidate all existing sessions
  ]);
  return { ok: true, message: "Your password has been reset. You can now sign in." };
}

// ───────────────────────────── Account settings ─────────────────────────────

const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1), newPassword: password, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  if (!(await rateLimit(`change-pwd:${user.id}`, 10, 900))) return TOO_MANY;

  const parsed = changePasswordSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };

  const full = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  const ok = await verifyPassword(parsed.data.currentPassword, full.passwordHash);
  if (!ok) return { ok: false, message: "Current password is incorrect.", fieldErrors: { currentPassword: "Current password is incorrect." } };

  const passwordHash = await hashPassword(parsed.data.newPassword);
  const jar = await cookies();
  const currentToken = jar.get(SESSION_COOKIE)?.value;
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: user.id, ...(currentToken ? { NOT: { tokenHash: sha256(currentToken) } } : {}) } }),
  ]);
  return { ok: true, message: "Password updated. You've been signed out of your other devices." };
}

const profileSchema = z.object({ name: text(100, 2), phone: z.string().optional() });

export async function updateProfileAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in." };
  const parsed = profileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted fields.", fieldErrors: zodFieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });
  return { ok: true, message: "Profile updated." };
}
