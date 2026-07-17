import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Header and Notification Panel Layout Spec', () => {
  test('should verify search bar alignment, no duplicate header buttons, and floating notification panel', async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(
      page,
      request,
      'notif-test@example.com',
      'Notif Test User',
      'Password123'
    );

    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    const profilePill = page.locator(`div:has-text("${user.name}")`).last();
    await expect(profilePill).toBeVisible({ timeout: 10000 });

    const topBar = page.locator('header').first();
    const headerBellBtn = topBar.locator('#header-notifications-btn');
    await expect(headerBellBtn).toBeVisible();
    await expect(topBar.locator('button[title*="theme"]')).toHaveCount(0);

    await headerBellBtn.click();
    await page.waitForTimeout(1000);

    const notificationPanel = page.locator('.fixed.right-4');
    await expect(notificationPanel).toBeVisible({ timeout: 10000 });

    const panelBox = await notificationPanel.boundingBox();
    expect(panelBox).not.toBeNull();
    console.log('Notification panel bounds:', panelBox);
    expect(panelBox!.x).toBeGreaterThan(700);
  });
});
