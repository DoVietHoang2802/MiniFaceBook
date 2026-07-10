import { test, expect } from '@playwright/test';

test.describe('Settings and Change Password Flow', () => {
  test('should register, verify, login, change password, auto logout, and login with new password successfully', async ({ page, request }) => {
    const email = `settings-test-${Date.now()}@example.com`;
    const name = 'Settings Test User';
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';

    // 1. Go to homepage and navigate to register
    await page.goto('/');
    await page.click('a:has-text("Đăng ký miễn phí")');

    // 2. Fill Register details
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', oldPassword);
    await page.fill('#register-confirm', oldPassword);
    await page.click('button[type="submit"]');

    // 3. Confirm Register Form navigated back to Login Form
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại');

    // 4. Verify account via Mailpit
    let token = '';
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(1000);
      const listResponse = await request.get('http://localhost:8025/api/v1/messages');
      if (listResponse.ok()) {
        const listData = await listResponse.json();
        const latestMsg = listData.messages?.find((msg: any) => 
          msg.To?.[0]?.Address === email && msg.Subject.includes('Verify your email')
        );

        if (latestMsg) {
          const detailResponse = await request.get(`http://localhost:8025/api/v1/message/${latestMsg.ID}`);
          if (detailResponse.ok()) {
            const detailData = await detailResponse.json();
            const bodyHtml = detailData.HTML || '';
            const match = bodyHtml.match(/token=([a-zA-Z0-9-_.]+)/);
            if (match && match[1]) {
              token = match[1];
              break;
            }
          }
        }
      }
    }
    expect(token).not.toBe('');

    // Trigger verification link on Backend
    const verifyResponse = await request.get(`http://localhost:8080/api/auth/verify?token=${token}`);
    expect(verifyResponse.ok()).toBe(true);

    // 5. Login with Old Password
    await page.fill('#login-email', email);
    await page.fill('#login-password', oldPassword);
    await page.click('button[type="submit"]');

    // 6. Confirm inside dashboard
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });

    // 7. Navigate to Settings page via Sidebar menu item "Cài đặt"
    await page.click('button[title="Cài đặt"]');

    // Confirm settings page header is visible
    await expect(page.locator('h2')).toContainText('Cài đặt tài khoản');

    // 8. Test Client Validation: New password too short
    await page.fill('#oldPassword', oldPassword);
    await page.fill('#newPassword', '123');
    await page.fill('#confirmPassword', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Mật khẩu mới phải có ít nhất 6 ký tự')).toBeVisible();

    // 9. Test Client Validation: Passwords do not match
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', 'WrongMatch123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Mật khẩu nhập lại không khớp')).toBeVisible();

    // 10. Perform Successful Change Password
    await page.fill('#confirmPassword', newPassword);
    await page.click('button[type="submit"]');

    // Expected behavior: success message shown (optional) and redirected back to login page
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại');

    // 11. Verify cannot login with old password anymore
    await page.fill('#login-email', email);
    await page.fill('#login-password', oldPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email hoặc mật khẩu không chính xác')).toBeVisible();

    // 12. Verify can login with new password successfully
    await page.fill('#login-email', email);
    await page.fill('#login-password', newPassword);
    await page.press('#login-password', 'Enter');
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });
  });
});
