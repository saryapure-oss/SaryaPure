import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe!Admin123";
const stamp = Date.now();

test.describe.serial("Admin — staff access, newsletter and gift box controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });

  test("newsletter subscribers page loads and CSV export is reachable", async ({ page, request }) => {
    await page.goto("/admin/newsletter");
    await expect(page.getByRole("heading", { name: "Newsletter Subscribers" })).toBeVisible();

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    const res = await request.get("/api/admin/newsletter/export", { headers: { cookie: cookieHeader } });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
  });

  test("granting admin access to a non-existent email is rejected with a clear message", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Staff & Access" })).toBeVisible();
    await page.getByLabel("Email address").fill(`no-such-account.${stamp}@example.com`);
    await page.getByRole("button", { name: "Grant access" }).click();
    await expect(page.getByText(/no account found with that email/i)).toBeVisible({ timeout: 10000 });
  });

  test("product without images shows the missing-image warning in the admin list", async ({ page }) => {
    const categoryName = `E2E GiftCat ${stamp}`;
    const categorySlug = `e2e-giftcat-${stamp}`;
    await page.goto("/admin/categories/new");
    await page.getByLabel("Name").fill(categoryName);
    await page.getByLabel("Slug").fill(categorySlug);
    await page.getByRole("button", { name: "Create category" }).click();
    await expect(page).toHaveURL(/\/admin\/categories\/(?!new$)[a-z0-9]+$/, { timeout: 10000 });

    const productName = `E2E No Image Product ${stamp}`;
    const productSlug = `e2e-no-image-product-${stamp}`;
    const productSku = `E2ENOIMG${stamp}`;
    await page.goto("/admin/products/new");
    await page.getByLabel("Product name").fill(productName);
    await page.getByLabel("Slug").fill(productSlug);
    await page.getByLabel("SKU").fill(productSku);
    await page.getByLabel("Category").selectOption({ label: categoryName });
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/(?!new$)[a-z0-9]+$/, { timeout: 10000 });

    await expect(page.getByText("No images yet")).toBeVisible();

    await page.goto("/admin/products");
    await expect(page.getByText(/no image yet — customers will see a blank tile/i)).toBeVisible();
  });
});
