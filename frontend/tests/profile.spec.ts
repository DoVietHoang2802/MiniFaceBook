import { test, expect } from '@playwright/test';

// ============================================================
// Helper: Đăng ký, xác thực email qua Mailpit và đăng nhập
// ============================================================
async function registerAndLogin(
  page: any,
  request: any,
  email: string,
  name: string,
  password: string
) {
  await page.goto('/');
  await page.click('a:has-text("Đăng ký miễn phí")');
  await page.fill('#register-name', name);
  await page.fill('#register-email', email);
  await page.fill('#register-password', password);
  await page.fill('#register-confirm', password);
  await page.click('button[type="submit"]');

  let token = '';
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(1500);
    const listResponse = await request.get('http://localhost:8025/api/v1/messages');
    if (listResponse.ok()) {
      const listData = await listResponse.json();
      const latestMsg = listData.messages?.find(
        (msg: any) =>
          msg.To?.[0]?.Address === email &&
          msg.Subject.includes('Verify your email')
      );
      if (latestMsg) {
        const detailResponse = await request.get(
          `http://localhost:8025/api/v1/message/${latestMsg.ID}`
        );
        if (detailResponse.ok()) {
          const detailData = await detailResponse.json();
          const match = detailData.HTML?.match(/token=([a-zA-Z0-9-_.]+)/);
          if (match && match[1]) {
            token = match[1];
            break;
          }
        }
      }
    }
  }
  expect(token).not.toBe('');
  const verifyResponse = await request.get(
    `http://localhost:8080/api/auth/verify?token=${token}`
  );
  expect(verifyResponse.ok()).toBe(true);

  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 30000 });
}

// ============================================================
// Test Suite: Profile Page
// ============================================================
test.describe('Profile Page - Sidebar & Real User Data', () => {
  /**
   * TEST 1: Trang cá nhân hiển thị đúng tên người dùng thật (không hiện email thô)
   */
  test('should display real user name (not email) as profile heading', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `profile-name-${ts}@example.com`;
    const name = `Profile User ${ts}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    // Tên thật phải có (ít nhất 1 từ đầu)
    await expect(heading).toContainText(name.split(' ')[0]);
    // KHÔNG hiển thị chuỗi email thô
    await expect(heading).not.toContainText('@example.com');
  });

  /**
   * TEST 2: Sidebar hiển thị đúng work và city sau khi cập nhật trong tab Giới thiệu
   * Dùng filter({ has: }) thay vì :near() để tương thích tốt hơn với CI
   */
  test('should save and display work and city in sidebar intro box', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `profile-details-${ts}@example.com`;
    const name = `Detail User ${ts}`;
    const password = 'Password123!';
    const workValue = 'Senior Engineer at Vizo';

    await registerAndLogin(page, request, email, name, password);

    // Vào trang cá nhân
    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Chuyển sang tab Giới thiệu
    await page.click('button:has-text("Giới thiệu")');
    await page.waitForTimeout(1000);

    // Tìm section "Chi tiết cá nhân" và click nút Chỉnh sửa bên trong nó
    const detailsSection = page.locator('div.p-6.rounded-2xl').filter({
      has: page.locator('h3:has-text("Chi tiết cá nhân")'),
    });
    await expect(detailsSection).toBeVisible({ timeout: 10000 });
    await detailsSection.locator('button:has-text("Chỉnh sửa")').click();
    await page.waitForTimeout(500);

    // Điền công việc
    const workField = page.locator('input[placeholder*="App Developer"]');
    await expect(workField).toBeVisible({ timeout: 5000 });
    await workField.fill(workValue);

    // Chọn thành phố Hồ Chí Minh từ dropdown CitySearchSelect
    // Nhấn vào trigger dropdown "Tỉnh/Thành phố hiện tại"
    const cityDropdownTrigger = page.locator('div.cursor-pointer').filter({
      hasText: 'Chọn tỉnh/thành phố hiện tại',
    }).first();
    await cityDropdownTrigger.click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Tìm kiếm tỉnh/thành..."]', 'Hồ Chí Minh');
    // Click vào option trong danh sách (không phải input)
    await page.locator('div.overflow-y-auto').locator('text=Hồ Chí Minh').click();
    await page.waitForTimeout(300);

    // Lưu
    await page.click('button[type="button"]:has-text("Lưu lại")');
    await expect(
      page.locator('text=Cập nhật chi tiết cá nhân thành công')
    ).toBeVisible({ timeout: 10000 });

    // Quay lại tab Bài viết để kiểm tra sidebar Intro Box
    await page.click('button:has-text("Bài viết")');
    await page.waitForTimeout(1000);

    const introBox = page.locator('div.p-5.rounded-2xl').filter({
      has: page.locator('h3:has-text("Giới thiệu")'),
    }).first();
    await expect(introBox).toBeVisible({ timeout: 8000 });
    await expect(introBox).toContainText('Công việc');
    await expect(introBox).toContainText(workValue);
    await expect(introBox).toContainText('Sống tại');
    await expect(introBox).toContainText('Hồ Chí Minh');
  });

  /**
   * TEST 3: Sidebar "Hình ảnh" có nút "Xem tất cả" kể cả khi chưa có ảnh
   */
  test('should show Photos box with "Xem tất cả" button on profile sidebar', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `profile-photos-${ts}@example.com`;
    const name = `Photos User ${ts}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Sidebar Photos Box
    const photosBox = page.locator('div.p-5.rounded-2xl').filter({
      has: page.locator('h3:has-text("Hình ảnh")'),
    });
    await expect(photosBox).toBeVisible({ timeout: 10000 });
    await expect(photosBox.locator('button:has-text("Xem tất cả")')).toBeVisible();
    // User mới chưa có ảnh
    await expect(photosBox.locator('text=Chưa có hình ảnh đăng tải')).toBeVisible();
  });

  /**
   * TEST 4: Sidebar "Bạn bè" có nút "Xem tất cả bạn bè" và hiển thị bạn sau khi kết bạn
   */
  test('should show Friends box with friends and "Xem tất cả bạn bè" button', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const password = 'Password123!';
    const userAEmail = `friendbox-a-${ts}@example.com`;
    const userAName = `FriendBox A ${ts}`;
    const userBEmail = `friendbox-b-${ts}@example.com`;
    const userBName = `FriendBox B ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);

      // User A gửi lời mời
      await pageA.click('button:has-text("Bạn bè")');
      await pageA.waitForTimeout(500);
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);
      await pageA.waitForTimeout(1000);
      const searchRowA = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
      await expect(searchRowA.locator('button:has-text("Kết bạn")')).toBeVisible({ timeout: 10000 });
      await searchRowA.locator('button:has-text("Kết bạn")').click();
      await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible({ timeout: 8000 });

      // User B chấp nhận
      await pageB.waitForTimeout(1500);
      await pageB.click('button:has-text("Bạn bè")');
      await pageB.waitForTimeout(500);
      await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
      await pageB.waitForTimeout(500);
      const requestRowB = pageB.locator('div.flex.items-center.justify-between').filter({ hasText: userAEmail });
      await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({ timeout: 10000 });
      await requestRowB.locator('button:has-text("Chấp nhận")').click();
      await pageA.waitForTimeout(2000);

      // User A vào trang cá nhân
      await pageA.click('button[title="Trang cá nhân"]');
      await pageA.waitForURL(/\/profile/, { timeout: 15000 });
      await pageA.waitForTimeout(2000);

      const friendsBox = pageA.locator('div.p-5.rounded-2xl').filter({
        has: pageA.locator('h3:has-text("Bạn bè")'),
      }).first();
      await expect(friendsBox).toBeVisible({ timeout: 10000 });
      await expect(friendsBox.locator('button:has-text("Xem tất cả bạn bè")')).toBeVisible();
      // User B phải có tên trong danh sách
      await expect(friendsBox.locator(`text=${userBName.split(' ')[0]}`)).toBeVisible({ timeout: 8000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  /**
   * TEST 5: Nút "Xem tất cả bạn bè" chuyển sang tab Bạn bè
   */
  test('should navigate to Friends tab when clicking "Xem tất cả bạn bè"', async ({
    page,
    request,
  }) => {
    const ts = Date.now();
    const email = `profile-friendtab-${ts}@example.com`;
    const name = `FriendTab User ${ts}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/, { timeout: 15000 });
    await page.waitForTimeout(1500);

    const friendsBox = page.locator('div.p-5.rounded-2xl').filter({
      has: page.locator('h3:has-text("Bạn bè")'),
    }).first();
    await expect(friendsBox).toBeVisible({ timeout: 10000 });
    await friendsBox.locator('button:has-text("Xem tất cả bạn bè")').click();
    await page.waitForTimeout(500);

    // Tab "Bạn bè" phải active (có indicator màu violet)
    const activeFriendsTab = page.locator('button:has-text("Bạn bè")').filter({
      has: page.locator('div.bg-violet-600'),
    });
    await expect(activeFriendsTab).toBeVisible({ timeout: 5000 });
  });
});
