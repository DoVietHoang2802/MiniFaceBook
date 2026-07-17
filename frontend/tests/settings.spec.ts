import { test, expect } from '@playwright/test';
import { loginAs, registerAndLogin } from './helpers/e2e-auth';

test.describe('Settings and Change Password Flow', () => {
  test('should register, verify, login, change password, auto logout, and login with new password successfully', async ({
    page,
    request,
  }) => {
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';

    const user = await registerAndLogin(
      page,
      request,
      'settings-test@example.com',
      'Settings Test User',
      oldPassword
    );

    await page.click('button[title="Cài đặt"]');
    await expect(page.locator('h2')).toContainText('Cài đặt');
    await page.getByRole('button', { name: /Đổi mật khẩu/i }).first().click();
    await expect(page.locator('#oldPassword')).toBeVisible();

    await page.fill('#oldPassword', oldPassword);
    await page.fill('#newPassword', '123');
    await page.fill('#confirmPassword', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Mật khẩu mới phải có ít nhất 6 ký tự')).toBeVisible();

    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', 'WrongMatch123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Mật khẩu nhập lại không khớp')).toBeVisible();

    await page.fill('#confirmPassword', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại', { timeout: 15000 });

    await page.fill('#login-email', user.email);
    await page.fill('#login-password', oldPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email hoặc mật khẩu không chính xác')).toBeVisible({
      timeout: 10000,
    });

    await loginAs(page, user.email, newPassword);
  });
});
