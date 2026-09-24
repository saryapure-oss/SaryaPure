import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = {
  "dashboard:view": ["ADMIN", "SUPER_ADMIN"],
  "products:manage": ["ADMIN", "SUPER_ADMIN"],
  "products:delete": ["SUPER_ADMIN"],
  "inventory:manage": ["ADMIN", "SUPER_ADMIN"],
  "orders:manage": ["ADMIN", "SUPER_ADMIN"],
  "orders:refund": ["SUPER_ADMIN"],
  "customers:view": ["ADMIN", "SUPER_ADMIN"],
  "coupons:manage": ["ADMIN", "SUPER_ADMIN"],
  "reviews:moderate": ["ADMIN", "SUPER_ADMIN"],
  "leads:manage": ["ADMIN", "SUPER_ADMIN"],
  "cms:manage": ["ADMIN", "SUPER_ADMIN"],
  "shipping:manage": ["SUPER_ADMIN"],
  "settings:manage": ["SUPER_ADMIN"],
  "users:manage": ["SUPER_ADMIN"],
  "audit:view": ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function isAdminRole(role: Role | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
