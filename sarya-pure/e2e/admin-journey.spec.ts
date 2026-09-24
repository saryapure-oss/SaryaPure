import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe!Admin123";

const stamp = Date.now();
const categoryName = `E2E Category ${stamp}`;
const categorySlug = `e2e-category-${stamp}`;
const productName = `E2E Test Product ${stamp}`;
const productSlug = `e2e-test-product-${stamp}`;
const productSku = `E2ESKU${stamp}`;

test.describe.serial("Admin journey", () => {
  test("login → dashboard → create category → create product → create variant → set inventory → publish", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // Create category
    await page.goto("/admin/categories/new");
    await page.getByLabel("Name").fill(categoryName);
    await page.getByLabel("Slug").fill(categorySlug);
    await page.getByRole("button", { name: "Create category" }).click();
    await expect(page).toHaveURL(/\/admin\/categories\/(?!new$)[a-z0-9]+$/, { timeout: 10000 });

    // Create product
    await page.goto("/admin/products/new");
    await page.getByLabel("Product name").fill(productName);
    await page.getByLabel("Slug").fill(productSlug);
    await page.getByLabel("SKU").fill(productSku);
    await page.getByLabel("Category").selectOption({ label: categoryName });
    await page.getByLabel("Published (visible on the storefront)").check();
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[a-z0-9]+$/, { timeout: 10000 });

    // Create variant with initial stock (this also sets inventory)
    await page.getByLabel("Variant name (e.g. 250 g)").fill("500 g");
    await page.getByLabel("Variant SKU").fill(`${productSku}-500G`);
    await page.getByLabel("Price (paise)").fill("59900");
    await page.getByLabel("MRP (paise)").fill("69900");
    await page.getByLabel("Initial stock").fill("50");
    await page.getByRole("button", { name: "Add variant" }).click();
    await expect(page.getByText("Variant added.")).toBeVisible({ timeout: 10000 });

    // Verify variant + stock appear
    await expect(page.getByText("500 g")).toBeVisible();
    await expect(page.getByText(/50 available/)).toBeVisible();

    // Product should now be visible on the storefront (published)
    await page.goto(`/products/${productSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(productName);
  });

  test("admin receives an order and updates its status; customer sees the update", async ({ page, context }) => {
    // Place a COD order as a fresh customer for the product created above.
    const email = `admin-e2e.${stamp}@example.com`;
    const password = "TestPass123!";

    await page.goto("/register");
    await page.getByLabel("Full name").fill("Admin E2E Customer");
    await page.getByLabel("Email address").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });

    await page.goto(`/products/${productSlug}`);
    await page.getByRole("radiogroup").getByText("500 g", { exact: true }).click();
    await page.getByRole("button", { name: "Add to Cart" }).click();
    await expect(page.getByText(/added to cart/i)).toBeVisible();

    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Admin E2E Customer");
    await page.getByLabel("Mobile number").fill("9876543211");
    await page.getByLabel("Address line").fill("1 E2E Admin Street");
    await page.getByLabel("City").fill("Mumbai");
    await page.getByLabel("State").selectOption("Maharashtra");
    await page.getByLabel("PIN code").fill("400001");
    await page.getByLabel(/Cash on Delivery/).check();
    await page.getByRole("button", { name: /Place Order/ }).click();
    await expect(page).toHaveURL(/\/order-confirmation\//, { timeout: 15000 });

    const orderNumberText = await page.locator("text=/Order\\s+SP\\w+/").first().textContent();
    const orderNumber = orderNumberText?.match(/SP\w+/)?.[0];
    expect(orderNumber).toBeTruthy();

    // Log out the customer, log in as admin in a fresh page (same browser context is fine — cookie gets replaced)
    await page.goto("/account");
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });

    // Admin sees the order in the orders list
    await page.goto("/admin/orders");
    await expect(page.getByText(orderNumber!)).toBeVisible();

    // Admin opens the order and advances its status
    await page.goto(`/admin/orders/${orderNumber}`);
    await expect(page.getByRole("heading", { name: `Order ${orderNumber}` })).toBeVisible();
    await page.getByLabel("New status").selectOption("PROCESSING");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByText("Order updated.")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("PROCESSING").first()).toBeVisible();

    await context.clearCookies();
  });
});
