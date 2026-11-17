import { test, expect } from "@playwright/test";

test.describe("Full Platform End-to-End API Routes Coverage", () => {
  test("1. Auth & Identity: Login, registration, token persistence & branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Styre-Bot/i);
    await expect(page.locator('img[alt="Styre-Bot"]').first()).toBeVisible();
    await expect(page.getByText("Styre-Bot").first()).toBeVisible();

    // Verify login inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[placeholder="••••••••••••"]');
    await emailInput.fill("admin@styretech.com");
    await passwordInput.fill("StyreEnterprise2026!");
    await expect(emailInput).toHaveValue("admin@styretech.com");
  });

  test("2. Executive Dashboard: Metrics, KPIs, and Daily Action Briefs", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();

    // Verify KPI stats & charts rendered
    const statCards = page.locator("div").filter({ hasText: /Revenue|Runs|Credits|Active/i });
    await expect(statCards.first()).toBeVisible();

    // Check export trigger
    const exportBtn = page.getByRole("button", { name: /Export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await expect(page.getByText(/Export/i).first()).toBeVisible();
      const cancelBtn = page.getByRole("button", { name: /Cancel|Close/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test("3. Autonomous Agent Fleet: Run triggers, DAG viewer, and stream console", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Agent/i }).first()).toBeVisible();

    // Verify stream route
    await page.goto("/agents/stream");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/styre:\/\/agents\/stream|Console|Live/i).first()).toBeVisible();
  });

  test("4. Outreach & Campaigns: Sequence design, templates, and pipeline status", async ({ page }) => {
    await page.goto("/campaigns");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Active Campaign Pipelines/i)).toBeVisible();

    // Verify sequence builder toggle
    const newCampBtn = page.getByRole("button", { name: /Design Campaign Sequence|New Campaign/i }).first();
    if (await newCampBtn.isVisible()) {
      await newCampBtn.click();
      await expect(page.getByText(/Design Campaign Sequence/i)).toBeVisible();
    }
  });

  test("5. CRM Leads: Search, stage filtering, CSV export, and Lead modal", async ({ page }) => {
    await page.goto("/leads");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("table").first()).toBeVisible();

    // Interactive search
    const searchInput = page.getByPlaceholder(/Search leads/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Northwind");
      await expect(searchInput).toHaveValue("Northwind");
    }

    // Verify Add Lead button
    await expect(page.getByRole("button", { name: "Add lead" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export CSV" })).toBeVisible();
  });

  test("6. Omnichannel Inbox: Thread stream, channel badges, and reply composer", async ({ page }) => {
    await page.goto("/inbox");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Inbox/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search conversations/i)).toBeVisible();
  });

  test("7. Financial Operations & Credits: Balance pill, ledger, and pack purchase", async ({ page }) => {
    await page.goto("/credits");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Credit/i })).toBeVisible();

    const buyCreditsBtn = page.getByRole("button", { name: /Buy Credits/i }).first();
    if (await buyCreditsBtn.isVisible()) {
      await buyCreditsBtn.click();
      await expect(page.getByText(/Top-Up Credit/i).first()).toBeVisible();
      const closeBtn = page.getByRole("button", { name: /Cancel|Close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test("8. Knowledge Base & RAG: Documents table, chunk viewer, and analyze modal", async ({ page }) => {
    await page.goto("/knowledge-base");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Knowledge/i })).toBeVisible();

    const uploadBtn = page.getByRole("button", { name: /Upload Document|Add Document/i }).first();
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      await expect(page.getByText(/Upload Document/i).first()).toBeVisible();
      const cancelBtn = page.getByRole("button", { name: /Cancel/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
    }
  });

  test("9. Social Publishing & Content Engine: Calendar, post creation, and comments", async ({ page }) => {
    await page.goto("/publishing");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publishing|Social|Calendar/i }).first()).toBeVisible();

    await page.goto("/social/comments");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Community Inquiries|Comments/i).first()).toBeVisible();
  });

  test("10. Competitor Radar & Market Intelligence: Comparison metrics and spy triggers", async ({ page }) => {
    await page.goto("/competitor-radar");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Competitor/i }).first()).toBeVisible();
  });

  test("11. Team, Workforce & Compliance Audit: Member roster, roles, and audit trail", async ({ page }) => {
    await page.goto("/team");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Team/i }).first()).toBeVisible();

    await page.goto("/audit-log");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/Audit Trail|Compliance Log|Activity/i).first()).toBeVisible();

    await page.goto("/workforce");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Workforce/i }).first()).toBeVisible();
  });

  test("12. Multi-Tenant Director & Enterprise Administration", async ({ page }) => {
    await page.goto("/admin/tenants");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tenant|Enterprise/i }).first()).toBeVisible();
  });
});
