import { test, expect } from "@playwright/test";

test.describe("Storefront content pages", () => {
  test("about, faq, gift-hampers, and policy pages render", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/faq");
    await expect(page.getByRole("heading", { name: "Frequently Asked Questions" })).toBeVisible();

    await page.goto("/gift-hampers");
    await expect(page.getByRole("heading", { name: "Gift Hampers" })).toBeVisible();

    await page.goto("/policies/privacy-policy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/not yet been reviewed by a legal professional/i)).toBeVisible();
  });

  test("contact form submits successfully", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Full name").fill("E2E Contact Tester");
    await page.getByLabel("Email address").fill(`contact-e2e.${Date.now()}@example.com`);
    await page.getByLabel("Subject").fill("Question about an order");
    await page.getByLabel("Message").fill("This is an automated end-to-end test message with enough length.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/thanks for reaching out/i)).toBeVisible({ timeout: 10000 });
  });

  test("b2b enquiry form submits successfully", async ({ page }) => {
    await page.goto("/b2b");
    await page.getByLabel("Full name").fill("E2E B2B Tester");
    await page.getByLabel("City").fill("Delhi");
    await page.getByLabel("Mobile number").fill("9876543210");
    await page.getByLabel("Email address").fill(`b2b-e2e.${Date.now()}@example.com`);
    await page.getByLabel("What products do you need?").fill("Almonds and cashews for retail resale.");
    await page.getByLabel("Estimated quantity").fill("200 kg / month");
    await page.getByRole("button", { name: "Submit enquiry" }).click();
    await expect(page.getByText(/thank you! your enquiry has been received/i)).toBeVisible({ timeout: 10000 });
  });

  test("unknown route shows the custom 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-e2e");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
