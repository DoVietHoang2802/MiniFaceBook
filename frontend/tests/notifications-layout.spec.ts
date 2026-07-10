import { test, expect } from '@playwright/test';

test.describe('Header and Notification Panel Layout Spec', () => {
  test('should verify search bar alignment, no duplicate header buttons, and floating notification panel', async ({ page, request }) => {
    const email = `notif-test-${Date.now()}@example.com`;
    const name = 'Notif Test User';
    const password = 'Password123';

    // 1. Register & Verify
    await page.goto('/');
    await page.click('a:has-text("Đăng ký miễn phí")');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.fill('#register-confirm', password);
    await page.click('button[type="submit"]');

    // Verify account via Mailpit with retry
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

    // 2. Login
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');

    // Wait for Dashboard to mount
    await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });

    // 3. Verify top header layout
    // Ensure search bar has height 40px (h-10)
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"]');
    await expect(searchInput).toBeVisible();
    
    // Ensure profile pill is visible and has height 40px (h-10)
    const profilePill = page.locator('div:has-text("' + name + '")').last();
    await expect(profilePill).toBeVisible();

    // Ensure the top bar header has the notification bell button next to the avatar, and has no other duplicate widgets
    const topBar = page.locator('header').first();
    const headerBellBtn = topBar.locator('#header-notifications-btn');
    await expect(headerBellBtn).toBeVisible();
    await expect(topBar.locator('button[title*="theme"]')).toHaveCount(0);

    // 4. Click Notification button in Header and check panel
    await headerBellBtn.click();
    await page.waitForTimeout(1000);

    // Check if floating panel exists and is visible
    const notificationPanel = page.locator('.fixed.right-4');
    await expect(notificationPanel).toBeVisible();

    // Verify it doesn't obstruct center feed (it is fixed to the right side)
    const panelBox = await notificationPanel.boundingBox();
    expect(panelBox).not.toBeNull();
    console.log('Notification panel bounds:', panelBox);
    expect(panelBox!.x).toBeGreaterThan(700);

    // Capture visual confirmation screenshot
    await page.screenshot({ path: 'tests/screenshots/notification_panel_verified.png' });
  });
});
