import { test, expect } from '@playwright/test';

test.describe('Real-time Chat Flow', () => {
  test('should exchange real-time chat messages between two users successfully', async ({ browser, request }) => {
    const userAEmail = `chata-${Date.now()}@example.com`;
    const userAName = `Chat User A ${Date.now()}`;
    
    const userBEmail = `chatb-${Date.now()}@example.com`;
    const userBName = `Chat User B ${Date.now()}`;
    
    const password = 'Password123!';
    const messageText = `Hi User B, this is a real-time message at ${Date.now()}`;

    // 1. Khởi tạo Context và Page cho User A
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    pageA.on('console', msg => console.log('PAGE A LOG:', msg.text()));
    pageA.on('pageerror', err => console.log('PAGE A ERROR:', err.message));
    pageA.on('requestfailed', req => console.log('PAGE A REQUEST FAILED:', req.url(), req.failure()?.errorText));
    pageA.on('response', res => {
      if (res.status() >= 400) {
        console.log('PAGE A HTTP ERROR:', res.status(), res.url());
      }
    });

    // 2. Khởi tạo Context và Page cho User B
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    pageB.on('console', msg => console.log('PAGE B LOG:', msg.text()));
    pageB.on('pageerror', err => console.log('PAGE B ERROR:', err.message));
    pageB.on('requestfailed', req => console.log('PAGE B REQUEST FAILED:', req.url(), req.failure()?.errorText));
    pageB.on('response', res => {
      if (res.status() >= 400) {
        console.log('PAGE B HTTP ERROR:', res.status(), res.url());
      }
    });

    // --- Đăng ký & Kích hoạt User A ---
    await pageA.goto('/');
    await pageA.click('button:has-text("Đăng ký miễn phí")');
    await pageA.fill('#register-name', userAName);
    await pageA.fill('#register-email', userAEmail);
    await pageA.fill('#register-password', password);
    await pageA.fill('#register-confirm', password);
    await pageA.click('button[type="submit"]');

    let tokenA = '';
    for (let i = 0; i < 5; i++) {
      await pageA.waitForTimeout(1000);
      const listResponse = await request.get('http://localhost:8025/api/v1/messages');
      if (listResponse.ok()) {
        const listData = await listResponse.json();
        const latestMsg = listData.messages?.find((msg: any) => 
          msg.To?.[0]?.Address === userAEmail && msg.Subject.includes('Verify your email')
        );
        if (latestMsg) {
          const detailResponse = await request.get(`http://localhost:8025/api/v1/message/${latestMsg.ID}`);
          if (detailResponse.ok()) {
            const detailData = await detailResponse.json();
            const match = detailData.HTML?.match(/token=([a-zA-Z0-9-_.]+)/);
            if (match && match[1]) {
              tokenA = match[1];
              break;
            }
          }
        }
      }
    }
    expect(tokenA).not.toBe('');
    const verifyResponseA = await request.get(`http://localhost:8080/api/auth/verify?token=${tokenA}`);
    expect(verifyResponseA.ok()).toBe(true);

    // --- Đăng ký & Kích hoạt User B ---
    await pageB.goto('/');
    await pageB.click('button:has-text("Đăng ký miễn phí")');
    await pageB.fill('#register-name', userBName);
    await pageB.fill('#register-email', userBEmail);
    await pageB.fill('#register-password', password);
    await pageB.fill('#register-confirm', password);
    await pageB.click('button[type="submit"]');

    let tokenB = '';
    for (let i = 0; i < 5; i++) {
      await pageB.waitForTimeout(1000);
      const listResponse = await request.get('http://localhost:8025/api/v1/messages');
      if (listResponse.ok()) {
        const listData = await listResponse.json();
        const latestMsg = listData.messages?.find((msg: any) => 
          msg.To?.[0]?.Address === userBEmail && msg.Subject.includes('Verify your email')
        );
        if (latestMsg) {
          const detailResponse = await request.get(`http://localhost:8025/api/v1/message/${latestMsg.ID}`);
          if (detailResponse.ok()) {
            const detailData = await detailResponse.json();
            const match = detailData.HTML?.match(/token=([a-zA-Z0-9-_.]+)/);
            if (match && match[1]) {
              tokenB = match[1];
              break;
            }
          }
        }
      }
    }
    expect(tokenB).not.toBe('');
    const verifyResponseB = await request.get(`http://localhost:8080/api/auth/verify?token=${tokenB}`);
    expect(verifyResponseB.ok()).toBe(true);

    // --- Đăng nhập cả hai ---
    await pageA.fill('#login-email', userAEmail);
    await pageA.fill('#login-password', password);
    await pageA.click('button[type="submit"]');
    await expect(pageA.locator('aside').first()).toBeVisible();

    await pageB.fill('#login-email', userBEmail);
    await pageB.fill('#login-password', password);
    await pageB.click('button[type="submit"]');
    await expect(pageB.locator('aside').first()).toBeVisible();

    // --- Kết bạn ---
    // User A đi tới tab Bạn bè, tìm kiếm User B và click kết bạn
    await pageA.click('button:has-text("Bạn bè")');
    await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);
    
    // Tìm đúng hàng chứa email của User B để kết bạn
    const searchRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    const connectBtn = searchRow.locator('button:has-text("Kết bạn")');
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();
    await expect(searchRow.locator('button:has-text("Thu hồi")')).toBeVisible();

    // Chờ 1 giây để đảm bảo DB cập nhật xong trạng thái lời mời đã gửi
    await pageB.waitForTimeout(1000);
    // User B vào tab Bạn bè -> Lời mời kết bạn để chấp nhận
    await pageB.click('button:has-text("Bạn bè")');
    await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
    
    // Tìm hàng của User A bằng email để chấp nhận lời mời
    const requestRow = pageB.locator('div.flex.items-center.justify-between').filter({ hasText: userAEmail });
    const acceptBtn = requestRow.locator('button:has-text("Chấp nhận")');
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();
    await expect(acceptBtn).not.toBeVisible();

    // --- Gửi tin nhắn Chats realtime ---
    // Chờ 1 giây để đảm bảo DB cập nhật xong trạng thái kết bạn
    await pageA.waitForTimeout(1000);
    // User A chuyển sang sub-tab bạn bè để click Nhắn tin
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    
    // Tìm hàng của User B bằng email để click Nhắn tin
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    const messageLink = friendRow.locator('button:has-text("Nhắn tin")');
    await expect(messageLink).toBeVisible();
    await messageLink.click();

    // Xác thực User A đã chuyển sang trang Chats và cuộc trò chuyện trống đã load xong
    const chatInputA = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInputA).toBeVisible();
    await expect(pageA.locator('text=Bắt đầu gửi tin nhắn chào mừng bạn mới nhé!')).toBeVisible();

    // User B chủ động chuyển sang trang Trò chuyện và chờ load xong giao diện chưa chọn chat
    await pageB.click('button:has-text("Trò chuyện")');
    await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible();
    
    // User A gửi tin nhắn cho User B
    await chatInputA.fill(messageText);
    await pageA.press('input[placeholder^="Message"]', 'Enter');

    // User B nhận được tin nhắn trong sidebar trái và click mở cuộc trò chuyện
    const userAChatItem = pageB.locator('div.cursor-pointer').filter({ hasText: messageText.substring(0, 10) });
    await expect(userAChatItem).toBeVisible();
    await userAChatItem.click();

    // Xác thực tin nhắn hiển thị đúng nội dung bên khung chat User B
    const messageContainerB = pageB.locator('div.relative.z-10').filter({ hasText: messageText });
    await expect(messageContainerB).toBeVisible();

    // Cleanup contexts
    await contextA.close();
    await contextB.close();
  });
});
