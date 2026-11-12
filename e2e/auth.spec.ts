import { test, expect } from '@playwright/test';

test.describe('SMMA Platform - Complete UI & Navigation E2E', () => {
  test('01. Authentication & Dashboard Navigation', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await expect(page).toHaveTitle(/SMMA/i);

    // Verify brand logo and headings
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('text=SMMA').first()).toBeVisible();
    await expect(page.locator('text=Autonomous Agency Enclave').first()).toBeVisible();

    // Fill valid credentials directly (no auto-fill demo bar)
    const emailInput = page.locator('input#email');
    await emailInput.fill('admin@agency.com');
    const passwordInput = page.locator('input#password');
    await passwordInput.fill('admin123456');

    // Click Sign In
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Expect navigation to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();

    // Verify Dashboard KPI cards
    await expect(page.locator('text=Total Leads').first()).toBeVisible();
    await expect(page.locator('text=Hot Leads').first()).toBeVisible();
    await expect(page.locator('text=Total Conversations').first()).toBeVisible();
    await expect(page.locator('text=Scheduled Posts').first()).toBeVisible();
    await expect(page.locator('text=Published Posts').first()).toBeVisible();

    // 2. Navigate to Tenant Directory (SuperAdmin Portal)
    await page.click('nav a:has-text("Tenant Directory")');
    await page.waitForURL('**/admin/tenants');
    await expect(page.locator('h1:has-text("Tenant Organizations")')).toBeVisible();
    await expect(page.locator('text=Provisioned Agency Enclaves')).toBeVisible();

    // 3. Navigate to AI Agents
    await page.click('nav a:has-text("AI Agents")');
    await page.waitForURL('**/agents');
    await expect(page.locator('h1:has-text("Agent Workspace")')).toBeVisible();

    // 4. Navigate to Unified Inbox
    await page.click('nav a:has-text("Unified Inbox")');
    await page.waitForURL('**/inbox');
    await expect(page.locator('h1:has-text("Conversations & Inbound")')).toBeVisible();

    // 5. Navigate to Leads & Pipeline
    await page.click('nav a:has-text("Leads & Pipeline")');
    await page.waitForURL('**/leads');
    await expect(page.locator('h1:has-text("Captured Leads")')).toBeVisible();

    // 6. Navigate to Publishing
    await page.click('nav a:has-text("Publishing")');
    await page.waitForURL('**/publishing');
    await expect(page.locator('h1:has-text("Compose & Schedule")')).toBeVisible();

    // 7. Navigate to Social Channels
    await page.click('nav a:has-text("Social Channels")');
    await page.waitForURL('**/channels');
    await expect(page.locator('h1:has-text("Social Channels")')).toBeVisible();

    // 8. Navigate to Team Members
    await page.click('nav a:has-text("Team Members")');
    await page.waitForURL('**/team');
    await expect(page.locator('h1:has-text("Team")')).toBeVisible();

    // 9. Navigate to Organization Settings
    await page.click('nav a:has-text("Organization")');
    await page.waitForURL('**/organization');
    await expect(page.locator('h1:has-text("Organization Settings")')).toBeVisible();

    // Take screenshot of finished flow
    await page.screenshot({ path: 'test-results/dashboard-success.png' });
  });
});
