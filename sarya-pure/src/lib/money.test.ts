import { describe, it, expect } from "vitest";
import { formatINR, rupeesToPaise, paiseToRupees, discountPercent } from "./money";

describe("money (all amounts are integer paise — never floats, never trust client-supplied values)", () => {
  it("formats paise as a localized INR string", () => {
    expect(formatINR(59900)).toBe("₹599");
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(150050)).toBe("₹1,500.5");
  });

  it("converts rupees to paise, rounding to the nearest integer", () => {
    expect(rupeesToPaise(599)).toBe(59900);
    expect(rupeesToPaise(10.005)).toBe(1001); // floating-point rounding must not lose a paisa
    expect(rupeesToPaise(0)).toBe(0);
  });

  it("converts paise back to rupees", () => {
    expect(paiseToRupees(59900)).toBe(599);
    expect(paiseToRupees(1)).toBeCloseTo(0.01);
  });

  describe("discountPercent", () => {
    it("computes the rounded percentage off MRP", () => {
      expect(discountPercent(599, 999)).toBe(40);
      expect(discountPercent(750, 1000)).toBe(25);
    });

    it("returns 0 when there is no real discount (never show a fake/negative discount badge)", () => {
      expect(discountPercent(999, 999)).toBe(0); // price === mrp
      expect(discountPercent(1200, 999)).toBe(0); // price > mrp (bad data) must not produce a negative-looking "discount"
      expect(discountPercent(500, 0)).toBe(0); // mrp not set
    });
  });
});
