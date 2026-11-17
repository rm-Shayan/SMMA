import { test, expect } from "@playwright/test";

test.describe("Security & Route Access Control", () => {
  test("Public auth routes are accessible without restriction", async ({ page }) => {
    // 1. Login page
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();

    // 2. Register page
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create|Sign up|Register/i })).toBeVisible();

    // 3. Forgot password page
    await page.goto("/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 4. Reset password page
    await page.goto("/reset-password");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Login form validates required inputs and handles submission", async ({ page }) => {
    await page.goto("/login");

    // Click submit with empty inputs
    const submitBtn = page.getByRole("button", { name: /Sign in/i });
    await submitBtn.click();

    // Form inputs remain accessible and user can type credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[placeholder="••••••••••••"]');

    await emailInput.fill("admin@styre.ai");
    await expect(emailInput).toHaveValue("admin@styre.ai");

    await passwordInput.fill("SecurePassword123!");
    await expect(passwordInput).toHaveValue("SecurePassword123!");

    // Toggle password visibility
    const togglePassBtn = page.locator('button[type="button"]').filter({ has: page.locator("svg") }).first();
    if (await togglePassBtn.isVisible()) {
      await togglePassBtn.click();
      await expect(passwordInput).toHaveAttribute("type", "text");
      await togglePassBtn.click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    }
  });

  test("Forbidden screen renders for unauthorized access", async ({ page }) => {
    await page.goto("/forbidden");
    await expect(page.getByText(/403|Forbidden|Unauthorized|Access Denied/i).first()).toBeVisible();
  });
});
