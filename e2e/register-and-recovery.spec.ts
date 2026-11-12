import { test, expect } from '@playwright/test';

test.describe('SMMA Platform - Registration & Security Flows', () => {
  test('02. Agency Registration Validation & RBAC Guard', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Create Your Agency Enclave')).toBeVisible();
    await expect(page.locator('text=Privileged Role Assignment')).toBeVisible();

    // Trigger validation with empty inputs
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Agency or Company name is required')).toBeVisible();

    // Fill valid data
    await page.fill('input#companyName', 'Playwright Automated Agency LLC');
    await page.fill('input#fullName', 'QA Automation Engineer');
    await page.fill('input#email', `qa.test.${Date.now()}@agency.com`);
    await page.fill('input#password', 'SecurePass1234!');
    await page.fill('input#confirmPassword', 'SecurePass1234!');

    // Submit registration
    await page.click('button[type="submit"]');

    // Verify success confirmation card
    await expect(page.locator('text=Enclave Provisioned!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Pending Email Verification')).toBeVisible();
  });

  test('03. Forgot Password & Email Verification Screens', async ({ page }) => {
    // 1. Forgot password
    await page.goto('/forgot-password');
    await expect(page.locator('text=Reset Enclave Password')).toBeVisible();

    await page.fill('input#email', 'admin@agency.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Check Your Inbox')).toBeVisible({ timeout: 10000 });

    // 2. Email Verification Screen
    await page.goto('/verify-email');
    await expect(page.locator('text=Verify Your Account')).toBeVisible();
    await expect(page.locator('input#manualToken')).toBeVisible();

    // 3. Resend Verification Screen
    await page.goto('/resend-verification');
    await expect(page.locator('text=Resend Email Token')).toBeVisible();
  });
});

