import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Authentication Flow', () => {
  test('should register, verify via Mailpit, login and logout successfully', async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(
      page,
      request,
      'e2etest@example.com',
      'Playwright Test User',
      'Password123'
    );

    await expect(page.locator('aside').first()).toContainText('Trang cá nhân');

    const profilePill = page.locator(`header div:has-text("${user.name}")`).last();
    await profilePill.click();
    await page.click('button:has-text("Đăng xuất")');
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại');
  });
});
