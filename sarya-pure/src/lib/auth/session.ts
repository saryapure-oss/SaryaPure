import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { getClientIp, getUserAgent } from "@/lib/security/request";

export const SESSION_COOKIE = "sp_session";
const SESSION_TTL_DAYS = 30;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await db.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt, ip: await getClientIp(), userAgent: await getUserAgent() },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, { ...cookieBase, expires: expiresAt });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
  emailVerified: Date | null;
};

/** Request-scoped current user lookup. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, emailVerified: true, isActive: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const { isActive: _ignored, ...user } = session.user;
  void _ignored;
  return user;
});
