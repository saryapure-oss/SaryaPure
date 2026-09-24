import "server-only";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser, type SessionUser } from "./session";
import { can, isAdminRole, type Permission } from "./permissions";

export class AuthError extends Error {
  constructor(message = "Please sign in to continue.") {
    super(message);
  }
}

/** For pages: redirect anonymous users to login. */
export async function requireUser(nextPath = "/account"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** For admin pages. */
export async function requireAdminPage(permission: Permission = "dashboard:view"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin`);
  if (!isAdminRole(user.role) || !can(user.role, permission)) notFound(); // do not reveal admin routes to non-admins
  return user;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function assertUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  return user;
}

export async function assertPermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError();
  if (!can(user.role, permission)) throw new AuthError("You do not have permission to perform this action.");
  return user;
}
