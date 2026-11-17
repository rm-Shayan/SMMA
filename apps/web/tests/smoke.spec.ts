import { test, expect } from "@playwright/test";

test.describe("Styre-Bot Platform Critical Smoke Tests", () => {
  test("Auth flow & login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Styre-Bot/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("Dashboard loads without crashing", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("Campaigns and leads tables render", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.getByText("Active Campaign Pipelines")).toBeVisible();

    await page.goto("/leads");
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("SuperAdmin tenants screen is reachable for super_admin", async ({ page }) => {
    await page.goto("/admin/tenants");
    await expect(page).not.toHaveURL(/\/forbidden$/);
    await expect(page.locator("body")).toBeVisible();
  });
});
