import { describe, it, expect } from "vitest";
import { email, indianPhone, pincode, couponCode, slug, quantity, password, formToObject, zodFieldErrors } from "./common";
import { z } from "zod";

describe("shared Zod validators (server-side input gate for every form and Server Action)", () => {
  it("email accepts valid addresses and rejects junk", () => {
    expect(email.safeParse("customer@example.com").success).toBe(true);
    expect(email.safeParse("not-an-email").success).toBe(false);
    expect(email.safeParse("").success).toBe(false);
  });

  it("indianPhone requires a plausible 10-digit Indian mobile number", () => {
    expect(indianPhone.safeParse("9876543210").success).toBe(true);
    expect(indianPhone.safeParse("+91 98765 43210").success).toBe(true);
    expect(indianPhone.safeParse("12345").success).toBe(false);
    expect(indianPhone.safeParse("abcdefghij").success).toBe(false);
  });

  it("pincode requires exactly 6 digits, not starting with 0", () => {
    expect(pincode.safeParse("400001").success).toBe(true);
    expect(pincode.safeParse("012345").success).toBe(false);
    expect(pincode.safeParse("4000").success).toBe(false);
    expect(pincode.safeParse("abcdef").success).toBe(false);
  });

  it("couponCode and slug reject characters outside their allowed sets (defence against injection via free-text admin fields)", () => {
    expect(couponCode.safeParse("WELCOME10").success).toBe(true);
    expect(slug.safeParse("premium-almonds").success).toBe(true);
    expect(slug.safeParse("Not A Slug!").success).toBe(false);
  });

  it("quantity is a whole number between 1 and 50 (server-side cap independent of any client value)", () => {
    expect(quantity.safeParse("5").success).toBe(true);
    expect(quantity.safeParse(0).success).toBe(false);
    expect(quantity.safeParse(51).success).toBe(false);
    expect(quantity.safeParse(2.5).success).toBe(false);
  });

  it("password enforces a minimum bar (length + letters + numbers)", () => {
    expect(password.safeParse("weak").success).toBe(false);
    expect(password.safeParse("StrongPass123!").success).toBe(true);
  });
});

describe("formToObject", () => {
  it("flattens FormData into a plain object", () => {
    const fd = new FormData();
    fd.set("name", "Sarya Pure");
    fd.set("email", "hello@example.com");
    expect(formToObject(fd)).toEqual({ name: "Sarya Pure", email: "hello@example.com" });
  });

  it("collects repeated `key[]` entries into an array", () => {
    const fd = new FormData();
    fd.append("tags[]", "almonds");
    fd.append("tags[]", "premium");
    expect(formToObject(fd)).toEqual({ tags: ["almonds", "premium"] });
  });

  it("ignores React Server Action internal $ACTION_* fields", () => {
    const fd = new FormData();
    fd.set("$ACTION_ID_abc123", "xyz");
    fd.set("email", "hello@example.com");
    expect(formToObject(fd)).toEqual({ email: "hello@example.com" });
  });
});

describe("zodFieldErrors", () => {
  it("maps each issue to its field path, keeping only the first message per field", () => {
    const schema = z.object({ email: z.string().email(), name: z.string().min(2) });
    const result = schema.safeParse({ email: "bad", name: "a" });
    if (result.success) throw new Error("expected failure");
    const errors = zodFieldErrors(result.error);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(["email", "name"]));
    expect(typeof errors.email).toBe("string");
  });

  it("falls back to a _form key for root-level issues", () => {
    const schema = z.object({ a: z.string() }).refine(() => false, { message: "Custom root error" });
    const result = schema.safeParse({ a: "x" });
    if (result.success) throw new Error("expected failure");
    expect(zodFieldErrors(result.error)._form).toBe("Custom root error");
  });
});
