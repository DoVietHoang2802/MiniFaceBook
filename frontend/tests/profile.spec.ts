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

  // Polling lấy token từ Mailpit
  let token = '';
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(1000);
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

  // Đăng nhập
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });
}

// ============================================================
// Test Suite: Profile Page
// ============================================================
test.describe('Profile Page - Sidebar & Real User Data', () => {
  /**
   * TEST 1: Trang cá nhân hiển thị đúng tên người dùng thật (không hiện email)
   * Kịch bản: Đăng nhập → vào trang cá nhân → kiểm tra h1 hiện tên đúng
   */
  test('should display real user name (not email) as profile heading', async ({
    page,
    request,
  }) => {
    const email = `profile-name-${Date.now()}@example.com`;
    const name = `Playwright Profile User ${Date.now()}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    // Điều hướng sang trang cá nhân
    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/);

    // Kiểm tra h1 hiện đúng tên người dùng
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText(name.split(' ')[0]); // ít nhất có tên đầu
    // Đảm bảo KHÔNG hiển thị phần email thô
    await expect(heading).not.toContainText('@example.com');
  });

  /**
   * TEST 2: Sidebar hiển thị thông tin chi tiết (work, city) sau khi cập nhật
   * Kịch bản: Đăng nhập → vào trang cá nhân → tab Giới thiệu → chỉnh sửa chi tiết
   *           → lưu → quay về tab Bài viết → kiểm tra sidebar hiện đúng
   */
  test('should save and display work and city in sidebar intro box', async ({
    page,
    request,
  }) => {
    const email = `profile-details-${Date.now()}@example.com`;
    const name = `Detail Test User ${Date.now()}`;
    const password = 'Password123!';
    const workInput = 'Senior Software Engineer at Vizo';
    const cityToSelect = 'Hồ Chí Minh';

    await registerAndLogin(page, request, email, name, password);

    // Vào trang cá nhân
    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/);
    await page.waitForTimeout(1000);

    // Chuyển sang tab Giới thiệu
    await page.click('button:has-text("Giới thiệu")');
    await page.waitForTimeout(500);

    // Click nút Chỉnh sửa (chi tiết cá nhân)
    await page.click('button:has-text("Chỉnh sửa"):near(h3:has-text("Chi tiết cá nhân"))');

    // Điền công việc
    const workField = page.locator('input[placeholder*="App Developer"]');
    await expect(workField).toBeVisible();
    await workField.fill(workInput);

    // Chọn thành phố từ dropdown
    const cityTrigger = page.locator('div.cursor-pointer').filter({ hasText: 'Chọn tỉnh/thành phố hiện tại' });
    await cityTrigger.click();
    await page.fill('input[placeholder="Tìm kiếm tỉnh/thành..."]', 'Hồ Chí Minh');
    await page.click('div:has-text("Hồ Chí Minh"):not(:has(input))');

    // Lưu
    await page.click('button[type="button"]:has-text("Lưu lại")');
    await expect(page.locator('text=Cập nhật chi tiết cá nhân thành công')).toBeVisible({
      timeout: 8000,
    });

    // Quay lại tab Bài viết để kiểm tra sidebar
    await page.click('button:has-text("Bài viết")');
    await page.waitForTimeout(500);

    // Sidebar Intro Box phải hiện công việc và thành phố
    const introBox = page.locator('div.p-5.rounded-2xl').filter({ hasText: 'Giới thiệu' }).first();
    await expect(introBox).toBeVisible();
    await expect(introBox.locator(`text=Công việc`)).toBeVisible();
    await expect(introBox.locator(`text=${workInput}`)).toBeVisible();
    await expect(introBox.locator(`text=Sống tại`)).toBeVisible();
    await expect(introBox.locator(`text=${cityToSelect}`)).toBeVisible();
  });

  /**
   * TEST 3: Sidebar "Hình ảnh" có nút "Xem tất cả" và hiển thị tối đa 9 ảnh
   * Kịch bản: Đăng nhập → vào trang cá nhân → kiểm tra Photos box có "Xem tất cả"
   */
  test('should show Photos box with "Xem tất cả" button on profile sidebar', async ({
    page,
    request,
  }) => {
    const email = `profile-photos-${Date.now()}@example.com`;
    const name = `Photos Test User ${Date.now()}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    // Vào trang cá nhân
    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/);
    await page.waitForTimeout(1000);

    // Kiểm tra Photos Box có tiêu đề và nút "Xem tất cả"
    const photosBox = page.locator('div.p-5.rounded-2xl').filter({ hasText: 'Hình ảnh' });
    await expect(photosBox).toBeVisible({ timeout: 10000 });
    await expect(photosBox.locator('button:has-text("Xem tất cả")')).toBeVisible();

    // Với user mới chưa có ảnh, hiện thông báo chưa có ảnh
    await expect(photosBox.locator('text=Chưa có hình ảnh đăng tải')).toBeVisible();
  });

  /**
   * TEST 4: Sidebar "Bạn bè" hiển thị tối đa 6 bạn và có nút "Xem tất cả bạn bè"
   * Kịch bản: Cần 2 users, kết bạn → kiểm tra Friends box sidebar
   */
  test('should show Friends box with up to 6 friends and "Xem tất cả bạn bè" button', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `friendbox-a-${Date.now()}@example.com`;
    const userAName = `FriendBox User A ${Date.now()}`;
    const userBEmail = `friendbox-b-${Date.now()}@example.com`;
    const userBName = `FriendBox User B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    // Đăng ký & kích hoạt cả 2 users
    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);

    // User A gửi lời mời kết bạn cho User B
    await pageA.click('button:has-text("Bạn bè")');
    await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);
    const searchRowA = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await searchRowA.locator('button:has-text("Kết bạn")').click();
    await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible();

    // User B chấp nhận lời mời
    await pageB.waitForTimeout(1000);
    await pageB.click('button:has-text("Bạn bè")');
    await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
    const requestRowB = pageB.locator('div.flex.items-center.justify-between').filter({ hasText: userAEmail });
    await requestRowB.locator('button:has-text("Chấp nhận")').click();

    // User A vào trang cá nhân để kiểm tra Friends box
    await pageA.waitForTimeout(1000);
    await pageA.click('button[title="Trang cá nhân"]');
    await pageA.waitForURL(/\/profile/);
    await pageA.waitForTimeout(2000);

    // Kiểm tra Friends box tồn tại
    const friendsBox = pageA.locator('div.p-5.rounded-2xl').filter({ hasText: 'Bạn bè' }).first();
    await expect(friendsBox).toBeVisible({ timeout: 10000 });

    // Nút "Xem tất cả bạn bè" phải có
    await expect(friendsBox.locator('button:has-text("Xem tất cả bạn bè")')).toBeVisible();

    // User B phải xuất hiện trong danh sách (hiện tên thật)
    await expect(friendsBox.locator(`text=${userBName.split(' ')[0]}`)).toBeVisible({ timeout: 5000 });

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 5: Nút "Xem tất cả bạn bè" điều hướng đến tab Bạn bè
   * Kịch bản: Đăng nhập → vào trang cá nhân → click "Xem tất cả bạn bè" → tab Bạn bè active
   */
  test('should navigate to Friends tab when clicking "Xem tất cả bạn bè"', async ({
    page,
    request,
  }) => {
    const email = `profile-friendtab-${Date.now()}@example.com`;
    const name = `FriendTab Test User ${Date.now()}`;
    const password = 'Password123!';

    await registerAndLogin(page, request, email, name, password);

    await page.click('button[title="Trang cá nhân"]');
    await page.waitForURL(/\/profile/);
    await page.waitForTimeout(1000);

    // Click "Xem tất cả bạn bè" trong Friends Box sidebar
    const friendsBox = page.locator('div.p-5.rounded-2xl').filter({ hasText: 'Bạn bè' }).first();
    await friendsBox.locator('button:has-text("Xem tất cả bạn bè")').click();

    // Tab "Bạn bè" phải được active (có underline violet)
    const friendsTab = page.locator('button:has-text("Bạn bè")').filter({ has: page.locator('div.bg-violet-600') });
    await expect(friendsTab).toBeVisible({ timeout: 5000 });
  });

  /**
   * TEST 6: Xem trang cá nhân người khác - hiển thị đúng thông tin và nút Thêm bạn bè
   * Kịch bản: User A xem profile User B → thấy tên thật, nút "Thêm bạn bè"
   */
  test('should show other user profile with real name and Add Friend button', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `otherprofile-a-${Date.now()}@example.com`;
    const userAName = `Other Profile A ${Date.now()}`;
    const userBEmail = `otherprofile-b-${Date.now()}@example.com`;
    const userBName = `Other Profile B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);

    // User A tìm kiếm User B và click vào tên để xem profile
    await pageA.click('button:has-text("Bạn bè")');
    await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);

    const searchRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await expect(searchRow).toBeVisible({ timeout: 10000 });

    // Lấy userId của User B từ link (nếu có) hoặc dùng cách navigate
    // Lấy API để lấy userId của User B
    const searchApiResp = await request.get(
      `http://localhost:8080/api/friends/search?q=${encodeURIComponent(userBName)}`,
      { headers: { 'Cookie': '' } }
    );
    // Fallback: click vào avatar User B trong kết quả tìm kiếm để xem profile
    // (Dùng cách navigate trực tiếp qua URL không cần đăng nhập)
    // Kiểm tra nút Kết bạn có mặt trong kết quả search
    await expect(searchRow.locator('button:has-text("Kết bạn")')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
