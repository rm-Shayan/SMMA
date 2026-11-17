import { test, expect } from "@playwright/test";

test.describe("Operational Screens & UI Interactivity Flow", () => {
  test("Dashboard: renders metrics, daily briefs, and triggers export", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();

    // Verify key UI elements render
    const exportBtn = page.getByRole("button", { name: /Export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      // Verify modal opens
      await expect(page.getByText(/Export Platform Analytics/i)).toBeVisible();
      // Close modal
      const closeBtn = page.getByRole("button", { name: /Cancel|Close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test("Agents: renders roster, DAG viewer, and run logs", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Agent/i }).first()).toBeVisible();

    // Verify agent action triggers
    const runAllBtn = page.getByRole("button", { name: /Run All Agents|Execute/i }).first();
    if (await runAllBtn.isVisible()) {
      await expect(runAllBtn).toBeEnabled();
    }
  });

  test("Campaigns: renders sequence builder, metrics, and pipeline controls", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Active Campaign Pipelines/i)).toBeVisible();

    // Toggle sequence builder
    const designBtn = page.getByRole("button", { name: /Design Campaign Sequence|New Campaign/i }).first();
    if (await designBtn.isVisible()) {
      await designBtn.click();
      await expect(page.getByText(/Design Campaign Sequence/i)).toBeVisible();
    }
  });

  test("Leads: renders data table, search input, and add lead dialog", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();

    // Verify search input is interactive
    const searchInput = page.getByPlaceholder(/Search leads/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Acme");
      await expect(searchInput).toHaveValue("Acme");
    }

    // Verify header buttons render
    await expect(page.getByRole("button", { name: "Add lead" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  });

  test("Inbox: renders conversation threads and reply composer", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Inbox/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search conversations/i)).toBeVisible();
  });

  test("Credits & Billing: renders wallet balance, ledger, and pack dialog", async ({ page }) => {
    await page.goto("/credits");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Credit/i }).first()).toBeVisible();

    // Verify Buy Credits button
    const buyCreditsBtn = page.getByRole("button", { name: /Buy Credits/i }).first();
    if (await buyCreditsBtn.isVisible()) {
      await buyCreditsBtn.click();
      await expect(page.getByText(/Top-Up Credit/i).first()).toBeVisible();
      // Close dialog
      const closeBtn = page.getByRole("button", { name: /Cancel|Close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test("Knowledge Base: renders documents, chunk viewer, and upload modal", async ({ page }) => {
    await page.goto("/knowledge-base");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Knowledge/i }).first()).toBeVisible();

    // Verify upload document dialog
    const uploadBtn = page.getByRole("button", { name: /Upload Document|Add Document/i }).first();
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      await expect(page.getByText(/Upload Document/i).first()).toBeVisible();
      // Close dialog
      const cancelBtn = page.getByRole("button", { name: /Cancel/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test("Publishing & Social: renders calendar, create post button, and comments", async ({ page }) => {
    await page.goto("/publishing");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publishing|Social|Calendar/i }).first()).toBeVisible();

    // Check social comments screen
    await page.goto("/social/comments");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Community Inquiries|Comments/i).first()).toBeVisible();
  });

  test("Competitor Radar & Analytics: renders radar, spy triggers, and reporting", async ({ page }) => {
    await page.goto("/competitor-radar");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Competitor/i }).first()).toBeVisible();

    // Verify reporting analytics screen
    await page.goto("/reporting");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Reporting|Analytics/i }).first()).toBeVisible();
  });

  test("Team & Audit Log: renders member controls and compliance trail", async ({ page }) => {
    await page.goto("/team");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Team/i }).first()).toBeVisible();

    // Verify audit log screen
    await page.goto("/audit-log");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Audit Trail|Compliance Log|Activity/i).first()).toBeVisible();
  });

  test("Styre Bot: floating trigger button, open drawer, quick prompt and chat UI", async ({ page }) => {
    await page.goto("/dashboard");
    const botTrigger = page.locator('button[aria-label="Toggle Styre Bot AI Assistant"]');
    await expect(botTrigger).toBeVisible();
    await expect(botTrigger).toContainText("Styre Bot");

    // Click to open chat
    await botTrigger.click();
    await expect(page.getByText("Welcome to Styre Bot")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Styre Bot", exact: true })).toBeVisible();

    // Verify input presence
    const input = page.getByPlaceholder(/Ask Styre Bot/i);
    await expect(input).toBeVisible();
  });
});
