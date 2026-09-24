import { test, expect } from "@playwright/test";

const email = `e2e.${Date.now()}@example.com`;
const password = "TestPass123!";

test.describe.serial("Customer purchase journey", () => {
  test("register → browse → add to cart → coupon → checkout → COD order → tracking", async ({ page }) => {
    // Home
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pure Goodness");

    // Register
    await page.goto("/register");
    await page.getByLabel("Full name").fill("E2E Tester");
    await page.getByLabel("Email address").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account/);

    // Shop -> category -> product
    await page.goto("/shop");
    await expect(page.getByText(/products?$/)).toBeVisible();
    await page.goto("/category/almonds");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Almonds");

    await page.goto("/products/premium-california-almonds");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Premium California Almonds");

    // Select a variant (500 g, above the WELCOME10 coupon's minimum order value) then add to cart
    await page.getByRole("radiogroup").getByText("500 g", { exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    // Cart
    await page.goto("/cart");
    await expect(page.getByTestId("cart-line")).toBeVisible();

    // Apply coupon
    await page.getByLabel("Have a coupon?").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/WELCOME10 applied/i)).toBeVisible();

    // Checkout
    await page.getByRole("link", { name: "Proceed to Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/);

    await page.getByLabel("Full name").fill("E2E Tester");
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Address line").fill("221B Test Street");
    await page.getByLabel("City").fill("Mumbai");
    await page.getByLabel("State").selectOption("Maharashtra");
    await page.getByLabel("PIN code").fill("400001");

    // Choose Cash on Delivery to avoid needing the live Razorpay widget
    await page.getByLabel(/Cash on Delivery/).check();
    await page.getByRole("button", { name: /Place Order/ }).click();

    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 15000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you for your order");

    const orderNumberText = await page.locator("text=/Order\\s+SP\\w+/").first().textContent();
    const orderNumber = orderNumberText?.match(/SP\w+/)?.[0];
    expect(orderNumber).toBeTruthy();

    // Track this order
    await page.getByRole("link", { name: "Track this order" }).click();
    await expect(page).toHaveURL(new RegExp(`/account/orders/${orderNumber}`));
    await expect(page.getByText("Order Placed")).toBeVisible();
    await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();

    // My account
    await page.goto("/account");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await page.goto("/account/orders");
    await expect(page.getByText(orderNumber!)).toBeVisible();
  });
});
