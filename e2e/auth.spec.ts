import { test, expect } from '@playwright/test';

test.describe('SMMA Platform - Complete UI & Navigation E2E', () => {
  test('01. Authentication & Dashboard Navigation', async ({ page }) => {
    // 1. Visit Login
    await page.goto('/login');
    await expect(page).toHaveTitle(/SMMA/i);

    // Verify brand logo and headings
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
    await expect(page.locator('text=SMMA.AI').first()).toBeVisible();
    await expect(page.locator('text=v4.2').first()).toBeVisible();

    // Verify Quick Demo Pills exist
    const adminPill = page.locator('button:has-text("SuperAdmin")');
    await expect(adminPill).toBeVisible();

    // Click demo SuperAdmin pill to auto-populate
    await adminPill.click();

    // Verify input fields populated
    const emailInput = page.locator('input#email');
    await expect(emailInput).toHaveValue('admin@agency.com');

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

    // Verify Platform breakdown
    await expect(page.locator('text=Platform Breakdown')).toBeVisible();

    // 2. Navigate to Agent Workspace
    await page.click('nav a:has-text("Agent Workspace")');
    await page.waitForURL('**/agents');
    await expect(page.locator('h1:has-text("Agent Workspace")')).toBeVisible();

    // 3. Navigate to Inbox
    await page.click('nav a:has-text("Inbox")');
    await page.waitForURL('**/inbox');
    await expect(page.locator('h1:has-text("Conversations & Inbound")')).toBeVisible();

    // 4. Navigate to Leads
    await page.click('nav a:has-text("Leads")');
    await page.waitForURL('**/leads');
    await expect(page.locator('h1:has-text("Captured Leads")')).toBeVisible();

    // 5. Navigate to Action Approvals (HITL Gate)
    await page.click('nav a:has-text("Action Approvals")');
    await page.waitForURL('**/approvals');
    await expect(page.locator('h1:has-text("Action Approvals")')).toBeVisible();

    // 6. Navigate to Publishing
    await page.click('nav a:has-text("Publishing")');
    await page.waitForURL('**/publishing');
    await expect(page.locator('h1:has-text("Compose & Schedule")')).toBeVisible();

    // 7. Navigate to Social Channels
    await page.click('nav a:has-text("Social Channels")');
    await page.waitForURL('**/channels');
    await expect(page.locator('h1:has-text("Social Channels")')).toBeVisible();

    // 8. Navigate to External Tools
    await page.click('nav a:has-text("External Tools")');
    await page.waitForURL('**/tools');
    await expect(page.locator('h1:has-text("External Systems")')).toBeVisible();

    // 9. Navigate to SOP & Training
    await page.click('nav a:has-text("SOP & Training")');
    await page.waitForURL('**/training');
    await expect(page.locator('h1:has-text("Company Training")')).toBeVisible();

    // 10. Navigate to Organization Settings
    await page.click('nav a:has-text("Organization")');
    await page.waitForURL('**/organization');
    await expect(page.locator('h1:has-text("Organization Settings")')).toBeVisible();

    // 11. Navigate to Team Management
    await page.click('nav a:has-text("Team")');
    await page.waitForURL('**/team');
    await expect(page.locator('h1:has-text("Team")')).toBeVisible();

    // Take screenshot of finished flow
    await page.screenshot({ path: 'test-results/dashboard-success.png' });
  });
});
