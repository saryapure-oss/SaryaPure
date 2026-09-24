import { describe, it, expect } from "vitest";
import { can, isAdminRole, PERMISSIONS, type Permission } from "./permissions";

describe("RBAC permissions (the only gate between a request and an admin mutation)", () => {
  it("denies every permission to a CUSTOMER", () => {
    for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can("CUSTOMER", permission)).toBe(false);
    }
  });

  it("denies every permission when the role is missing", () => {
    for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can(undefined, permission)).toBe(false);
      expect(can(null, permission)).toBe(false);
    }
  });

  it("grants ADMIN the standard store-management permissions", () => {
    expect(can("ADMIN", "products:manage")).toBe(true);
    expect(can("ADMIN", "orders:manage")).toBe(true);
    expect(can("ADMIN", "cms:manage")).toBe(true);
  });

  it("restricts SUPER_ADMIN-only permissions from ADMIN", () => {
    expect(can("ADMIN", "products:delete")).toBe(false);
    expect(can("ADMIN", "orders:refund")).toBe(false);
    expect(can("ADMIN", "settings:manage")).toBe(false);
    expect(can("ADMIN", "shipping:manage")).toBe(false);
    expect(can("ADMIN", "users:manage")).toBe(false);
    expect(can("ADMIN", "audit:view")).toBe(false);
  });

  it("grants SUPER_ADMIN every defined permission", () => {
    for (const permission of Object.keys(PERMISSIONS) as Permission[]) {
      expect(can("SUPER_ADMIN", permission)).toBe(true);
    }
  });

  it("isAdminRole is true only for ADMIN and SUPER_ADMIN", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("SUPER_ADMIN")).toBe(true);
    expect(isAdminRole("CUSTOMER")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });
});
