import { test, expect } from '@playwright/test';

test.describe('Feed and Post Interactions Flow', () => {
  test('should create, like, comment, and delete a post successfully', async ({ page, request }) => {
    const email = `feedtest-${Date.now()}@example.com`;
    const name = 'Feed Tester';
    const password = 'Password123!';
    const postContent = `Hello, this is a Playwright E2E post at ${Date.now()}`;
    const commentContent = `This is an E2E comment! ${Date.now()}`;
    // Tự động đồng ý hộp thoại confirm khi xóa bài viết
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Bạn có chắc chắn muốn xóa bài viết này không?');
      await dialog.accept();
    });

    // 1. Đăng ký & Kích hoạt tài khoản người dùng mới
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

    // Kích hoạt tài khoản
    const verifyResponse = await request.get(`http://localhost:8080/api/auth/verify?token=${token}`);
    expect(verifyResponse.ok()).toBe(true);

    // Đăng nhập
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');

    // Đợi trang Dashboard/Feed hiển thị
    await expect(page.locator('aside').first()).toBeVisible();
    await page.waitForTimeout(1000);

    // 2. Tạo bài viết mới
    const postInput = page.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible();
    await postInput.fill(postContent);
    await page.click('button:has-text("Đăng bài")');

    // Đợi và xác thực bài viết mới xuất hiện trên Feed
    const postCard = page.locator('div.w-full.rounded-2xl.border.border-slate-200.bg-white').filter({ hasText: postContent });
    await expect(postCard).toBeVisible();

    // 3. Thả tim (Like) bài viết
    const likeBtn = postCard.locator('button:has-text("Thích")');
    await likeBtn.click();
    // Xác thực số lượt thích tăng lên 1
    await expect(postCard.locator('span.ml-1')).toHaveText('1');

    // 4. Mở chi tiết và bình luận
    const commentBtn = postCard.locator('button:has-text("Bình luận")');
    await commentBtn.click();

    // Xác thực Modal chi tiết được mở ra
    const detailModal = page.locator('div.fixed.inset-0.z-\\[99999\\]');
    await expect(detailModal).toBeVisible();

    // Viết bình luận trong modal
    const commentInput = detailModal.locator('textarea[placeholder="Viết bình luận..."]');
    await expect(commentInput).toBeVisible();
    await commentInput.fill(commentContent);
    
    // Nhấn gửi bình luận
    const submitCommentBtn = detailModal.locator('button.bg-blue-500');
    await submitCommentBtn.click();

    // Xác thực bình luận hiển thị trong danh sách bình luận
    await expect(detailModal.locator(`text=${commentContent}`)).toBeVisible();

    // Đóng modal chi tiết
    await detailModal.locator('button[title="Đóng"]').click();
    await expect(detailModal).not.toBeVisible();

    // 5. Xóa bài viết khỏi Feed
    const menuBtn = postCard.locator('button[title="Tùy chọn bài viết"]');
    await menuBtn.click();
    
    const deleteBtn = page.locator('button:has-text("Xóa bài viết")');
    await deleteBtn.click();

    // Xác thực bài viết biến mất khỏi Feed
    await expect(postCard).not.toBeVisible();
  });

  test('should load more posts on scroll (infinite scroll)', async ({ page, request }) => {
    const email = `scrolltest-${Date.now()}@example.com`;
    const name = 'Scroll Tester';
    const password = 'Password123!';
    
    await page.goto('/');
    await page.click('a:has-text("Đăng ký miễn phí")');
    await page.fill('#register-name', name);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.fill('#register-confirm', password);
    await page.click('button[type="submit"]');

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
    await request.get(`http://localhost:8080/api/auth/verify?token=${token}`);

    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]');
    await expect(page.locator('aside').first()).toBeVisible();

    // Cuộn xuống cuối trang để kích hoạt load thêm bài viết
    await page.evaluate(() => (window as any).scrollTo(0, (document as any).body.scrollHeight));
    await page.waitForTimeout(1000);
    
    // Đối với user mới chưa có nhiều bài viết, kết quả sẽ đạt tới cuối trang và hiện thông báo hết bài viết
    const endMsg = page.locator('text=Bạn đã xem hết bài viết');
    await expect(endMsg).toBeVisible();
  });
});
