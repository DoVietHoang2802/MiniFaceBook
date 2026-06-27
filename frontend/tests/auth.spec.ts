import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register, verify via Mailpit, login and logout successfully', async ({ page, request }) => {
    // Sinh email ngẫu nhiên cho mỗi lượt chạy test để tránh trùng lặp
    const email = `e2etest-${Date.now()}@example.com`;
    const name = 'Playwright Test User';
    const password = 'Password123';
    // 1. Đi tới trang đăng nhập mặc định
    await page.goto('/');

    // 2. Chuyển sang form Đăng ký tài khoản
    await page.click('a:has-text("Đăng ký miễn phí")');
    await expect(page.locator('h2')).toHaveText('Tạo tài khoản mới');

    // 3. Điền thông tin Đăng ký
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.fill('#register-confirm', password);

    // 4. Nhấn Đăng ký
    await page.click('button[type="submit"]');

    // Sau khi đăng ký thành công, UI sẽ chuyển đổi form đăng nhập
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại');

    // 5. Truy vấn Mailpit REST API để lấy link kích hoạt tài khoản
    let token = '';
    // Thử dò email tối đa 5 lần (mỗi lần cách nhau 1 giây) đề phòng độ trễ gửi thư
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

    // 6. Giả lập người dùng nhấn link kích hoạt bằng cách gửi request verify đến Backend
    const verifyResponse = await request.get(`http://localhost:8080/api/auth/verify?token=${token}`);
    expect(verifyResponse.ok()).toBe(true);

    // 7. Thực hiện Đăng nhập bằng tài khoản vừa kích hoạt
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');

    // Kiểm tra xem đã đăng nhập thành công chưa bằng cách xác thực hiển thị nút Chats/Trang cá nhân trên thanh Sidebar
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('aside').first()).toContainText('Trang cá nhân');

    // 8. Đăng xuất tài khoản
    // Click vào phần Profile Widget ở dưới góc trái (chứa email của user) để bật popover
    await page.click(`text=${email}`);
    // Click nút Đăng xuất trong popover
    await page.click('button:has-text("Đăng xuất")');

    // Đảm bảo hệ thống quay lại màn hình đăng nhập
    await expect(page.locator('h2')).toHaveText('Chào mừng trở lại');
  });
});
