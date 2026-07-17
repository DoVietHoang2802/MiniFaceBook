import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Profile Page - Sidebar & Real User Data', () => {
  test('should display real user name (not email) as profile heading', async ({
    page,
    request,
  }) => {
    const user = await registerAndLogin(
      page,
      request,
      'profile-name@example.com',
      'Profile User',
      'Password123!'
    );

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText(user.name.split(' ')[0]);
    await expect(heading).not.toContainText('@example.com');
  });

  test('should save and display work and city in sidebar intro box', async ({
    page,
    request,
  }) => {
    const workValue = 'Senior Engineer at Vizo';

    await registerAndLogin(
      page,
      request,
      'profile-details@example.com',
      'Detail User',
      'Password123!'
    );

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    await page.click('button:has-text("Giới thiệu")');
    await page.waitForTimeout(1000);

    const detailsSection = page.locator('div.p-6.rounded-2xl').filter({
      has: page.locator('h3:has-text("Chi tiết cá nhân")'),
    });
    await expect(detailsSection).toBeVisible({ timeout: 10000 });
    await detailsSection.locator('button:has-text("Chỉnh sửa")').click();
    await page.waitForTimeout(500);

    const workField = page.locator('input[placeholder*="App Developer"]');
    await expect(workField).toBeVisible({ timeout: 5000 });
    await workField.fill(workValue);

    const cityDropdownTrigger = page
      .locator('div.cursor-pointer')
      .filter({ hasText: 'Chọn tỉnh/thành phố hiện tại' })
      .first();
    await cityDropdownTrigger.click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Tìm kiếm tỉnh/thành..."]', 'Hồ Chí Minh');
    await page.locator('div.overflow-y-auto').locator('text=Hồ Chí Minh').click();
    await page.waitForTimeout(300);

    await page.click('button[type="button"]:has-text("Lưu thay đổi")');
    await expect(page.locator('text=Cập nhật chi tiết cá nhân thành công')).toBeVisible({
      timeout: 10000,
    });

    await page.click('button:has-text("Bài viết")');
    await page.waitForTimeout(1000);

    const introBox = page
      .locator('div.p-5.rounded-2xl')
      .filter({ has: page.locator('h3:has-text("Giới thiệu")') })
      .first();
    await expect(introBox).toBeVisible({ timeout: 8000 });
    await expect(introBox).toContainText('Công việc');
    await expect(introBox).toContainText(workValue);
    await expect(introBox).toContainText('Sống tại');
    await expect(introBox).toContainText('Hồ Chí Minh');
  });

  test('should show Photos box with "Xem tất cả" button on profile sidebar', async ({
    page,
    request,
  }) => {
    await registerAndLogin(
      page,
      request,
      'profile-photos@example.com',
      'Photos User',
      'Password123!'
    );

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    const photosBox = page.locator('div.p-5.rounded-2xl').filter({
      has: page.locator('h3:has-text("Hình ảnh")'),
    });
    await expect(photosBox).toBeVisible({ timeout: 10000 });
    await expect(photosBox.locator('button:has-text("Xem tất cả")')).toBeVisible();
    await expect(photosBox.locator('text=Chưa có hình ảnh đăng tải')).toBeVisible();
  });

  test('should show Friends box with friends and "Xem tất cả bạn bè" button', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      const userA = await registerAndLogin(
        pageA,
        request,
        'friendbox-a@example.com',
        'FriendBox A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'friendbox-b@example.com',
        'FriendBox B',
        password
      );

      await pageA.click('aside button[title="Bạn bè"]');
      await expect(
        pageA.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
      ).toBeVisible({ timeout: 8000 });
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userB.name);

      const searchRowA = pageA
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userB.email });
      await expect(searchRowA.locator('button:has-text("Kết bạn")')).toBeVisible({
        timeout: 12000,
      });
      await searchRowA.locator('button:has-text("Kết bạn")').click();
      await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible({
        timeout: 10000,
      });

      await pageB.click('aside button[title="Bạn bè"]');
      await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
      const requestRowB = pageB
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userA.email });
      await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({
        timeout: 15000,
      });
      await requestRowB.locator('button:has-text("Chấp nhận")').click();
      await pageA.waitForTimeout(2000);

      await pageA.click('button[title="Trang cá nhân"]');
      await pageA.waitForURL(/\/profile/, { timeout: 15000 });
      await pageA.waitForTimeout(2000);

      const friendsBox = pageA
        .locator('div.p-5.rounded-2xl')
        .filter({ has: pageA.locator('h3:has-text("Bạn bè")') })
        .first();
      await expect(friendsBox).toBeVisible({ timeout: 10000 });
      await expect(friendsBox.locator('button:has-text("Xem tất cả bạn bè")')).toBeVisible();
      await expect(friendsBox.locator(`text=${userB.name.split(' ')[0]}`)).toBeVisible({
        timeout: 8000,
      });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should navigate to Friends tab when clicking "Xem tất cả bạn bè"', async ({
    page,
    request,
  }) => {
    await registerAndLogin(
      page,
      request,
      'profile-friendtab@example.com',
      'FriendTab User',
      'Password123!'
    );

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    const friendsBox = page
      .locator('div.p-5.rounded-2xl')
      .filter({ has: page.locator('h3:has-text("Bạn bè")') })
      .first();
    await expect(friendsBox).toBeVisible({ timeout: 10000 });
    await friendsBox.locator('button:has-text("Xem tất cả bạn bè")').click();
    await page.waitForTimeout(500);

    const activeFriendsTab = page.locator('button:has-text("Bạn bè")').filter({
      has: page.locator('div.bg-violet-600'),
    });
    await expect(activeFriendsTab).toBeVisible({ timeout: 5000 });
  });
});
