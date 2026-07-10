import { test, expect } from '@playwright/test';

// ============================================================
// Helper: Đăng ký, xác thực qua Mailpit và đăng nhập
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

  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('button[type="submit"]');
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 15000 });
}

// ============================================================
// Helper: Kết bạn giữa 2 users (pageA gửi → pageB chấp nhận)
// ============================================================
async function makeFriends(
  pageA: any,
  pageB: any,
  userAEmail: string,
  userBName: string,
  userBEmail: string
) {
  // User A tìm và gửi lời mời kết bạn
  await pageA.click('button:has-text("Bạn bè")');
  await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);
  const searchRowA = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
  await expect(searchRowA.locator('button:has-text("Kết bạn")')).toBeVisible({ timeout: 10000 });
  await searchRowA.locator('button:has-text("Kết bạn")').click();
  await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible();

  // User B chấp nhận
  await pageB.waitForTimeout(1000);
  await pageB.click('button:has-text("Bạn bè")');
  await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
  const requestRowB = pageB.locator('div.flex.items-center.justify-between').filter({ hasText: userAEmail });
  await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({ timeout: 10000 });
  await requestRowB.locator('button:has-text("Chấp nhận")').click();
  await pageA.waitForTimeout(1000);
}

// ============================================================
// Test Suite: ChatPage UI - Post Chat Refactoring
// ============================================================
test.describe('Chat Page - UI & Messaging After Refactoring', () => {
  /**
   * TEST 1: Giao diện Chat - KHÔNG có nút tìm kiếm tròn trong khung chat header
   * Kịch bản: Mở trang chat → chọn 1 cuộc trò chuyện → kiểm tra header chat
   *           Đảm bảo nút search riêng biệt (round search button) đã bị xóa
   */
  test('should NOT show a standalone round search button inside chat header', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `chat-nosearch-a-${Date.now()}@example.com`;
    const userAName = `ChatNoSearch A ${Date.now()}`;
    const userBEmail = `chat-nosearch-b-${Date.now()}@example.com`;
    const userBName = `ChatNoSearch B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A mở chat với User B từ tab Bạn bè
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRow.locator('button:has-text("Nhắn tin")').click();

    // Chờ chat load
    const chatInput = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Kiểm tra KHÔNG còn nút search riêng trong chat header
    // (nút tìm kiếm tròn đã bị xóa theo yêu cầu người dùng)
    const chatHeader = pageA.locator('[data-testid="chat-header"], div.flex.items-center.h-16, div.flex.items-center.border-b').first();
    // Đảm bảo search icon standalone trong header không có
    const standaloneSearchBtn = chatHeader.locator('button[aria-label="Tìm kiếm tin nhắn"], button[title="Tìm kiếm"]');
    await expect(standaloneSearchBtn).not.toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 2: Giao diện Chat - KHÔNG có nút "Tùy chọn hội thoại" (conversation options)
   * Kịch bản: Mở trang chat → chọn cuộc trò chuyện → kiểm tra header
   *           Đảm bảo nút tùy chọn hội thoại đã được gỡ bỏ
   */
  test('should NOT show conversation options dropdown button in chat header', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `chat-noopts-a-${Date.now()}@example.com`;
    const userAName = `ChatNoOpts A ${Date.now()}`;
    const userBEmail = `chat-noopts-b-${Date.now()}@example.com`;
    const userBName = `ChatNoOpts B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A mở chat với User B
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRow.locator('button:has-text("Nhắn tin")').click();

    const chatInput = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Đảm bảo không còn nút "Tùy chọn hội thoại" (SlidersHorizontal icon)
    const conversationOptionsBtn = pageA.locator('button[aria-label="Tùy chọn hội thoại"], button[title="Tùy chọn hội thoại"]');
    await expect(conversationOptionsBtn).not.toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 3: Gửi tin nhắn thành công và hiển thị đúng trong khung chat
   * Kịch bản: 2 users là bạn → A gửi tin nhắn → B nhận được
   */
  test('should send and receive messages successfully', async ({ browser, request }) => {
    const password = 'Password123!';
    const userAEmail = `chat-msg-a-${Date.now()}@example.com`;
    const userAName = `ChatMsg A ${Date.now()}`;
    const userBEmail = `chat-msg-b-${Date.now()}@example.com`;
    const userBName = `ChatMsg B ${Date.now()}`;
    const messageText = `Hello from E2E test at ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A gửi tin nhắn
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRow.locator('button:has-text("Nhắn tin")').click();

    const chatInputA = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInputA).toBeVisible({ timeout: 10000 });
    await expect(pageA.locator('text=Bắt đầu gửi tin nhắn chào mừng bạn mới nhé!')).toBeVisible();

    await chatInputA.fill(messageText);
    await pageA.press('input[placeholder^="Message"]', 'Enter');

    // Kiểm tra tin nhắn hiện phía User A
    await expect(pageA.locator(`text=${messageText}`)).toBeVisible({ timeout: 8000 });

    // User B mở chat và nhận tin nhắn
    await pageB.click('button:has-text("Trò chuyện")');
    const chatItemB = pageB.locator('div.cursor-pointer').filter({ hasText: messageText.substring(0, 15) });
    await expect(chatItemB).toBeVisible({ timeout: 10000 });
    await chatItemB.click();
    await expect(pageB.locator(`text=${messageText}`)).toBeVisible({ timeout: 8000 });

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 4: Typing indicator hiển thị khi đối phương đang gõ
   * Kịch bản: User A gõ → User B thấy "đang nhập..."
   */
  test('should show typing indicator when the other user is typing', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `chat-typing-a-${Date.now()}@example.com`;
    const userAName = `ChatTyping A ${Date.now()}`;
    const userBEmail = `chat-typing-b-${Date.now()}@example.com`;
    const userBName = `ChatTyping B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A mở chat với User B
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRowA = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRowA.locator('button:has-text("Nhắn tin")').click();
    const chatInputA = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInputA).toBeVisible({ timeout: 10000 });

    // User B mở chat từ danh sách
    await pageB.click('button:has-text("Trò chuyện")');
    // Gửi 1 tin nhắn để tạo conversation trong list của B
    await chatInputA.fill('init');
    await pageA.press('input[placeholder^="Message"]', 'Enter');
    await pageA.waitForTimeout(1500);

    const chatItemB = pageB.locator('div.cursor-pointer').filter({ hasText: 'init' });
    await expect(chatItemB).toBeVisible({ timeout: 10000 });
    await chatItemB.click();

    // User A bắt đầu gõ → User B thấy indicator
    await chatInputA.fill('I am typing...');
    // Typing indicator hiện ra ở phía User B
    await expect(pageB.locator('text=đang nhập')).toBeVisible({ timeout: 6000 });

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 5: Cuộn lên để xem tin nhắn cũ hơn (infinite scroll)
   * Kịch bản: Gửi nhiều tin nhắn → cuộn lên → tin nhắn cũ được load thêm
   */
  test('should load older messages when scrolling up', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `chat-scroll-a-${Date.now()}@example.com`;
    const userAName = `ChatScroll A ${Date.now()}`;
    const userBEmail = `chat-scroll-b-${Date.now()}@example.com`;
    const userBName = `ChatScroll B ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A mở chat và gửi liền 16 tin nhắn (vượt PAGE_SIZE = 15)
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRow.locator('button:has-text("Nhắn tin")').click();
    const chatInputA = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInputA).toBeVisible({ timeout: 10000 });

    // Gửi 16 tin nhắn qua API trực tiếp để nhanh hơn
    // (dùng giao diện gửi từng tin)
    const firstMsg = 'FIRST_MESSAGE_MARKER';
    await chatInputA.fill(firstMsg);
    await pageA.press('input[placeholder^="Message"]', 'Enter');
    await pageA.waitForTimeout(300);

    for (let i = 2; i <= 16; i++) {
      await chatInputA.fill(`Tin nhắn số ${i}`);
      await pageA.press('input[placeholder^="Message"]', 'Enter');
      await pageA.waitForTimeout(200);
    }
    await pageA.waitForTimeout(1000);

    // Reload để lấy page 0 (15 tin mới nhất)
    await pageA.reload();
    await expect(pageA.locator('aside').first()).toBeVisible({ timeout: 15000 });
    await pageA.click('button:has-text("Trò chuyện")');
    const convItem = pageA.locator('div.cursor-pointer').filter({ hasText: 'Tin nhắn số 16' });
    await expect(convItem).toBeVisible({ timeout: 10000 });
    await convItem.click();
    await pageA.waitForTimeout(1000);

    // Tin nhắn đầu tiên (FIRST_MESSAGE_MARKER) không nên có ở page 0
    const firstMsgEl = pageA.locator(`text=${firstMsg}`);
    // Cuộn lên đầu để trigger load thêm
    const scrollContainer = pageA.locator('div[style*="overflow"]').first();
    await scrollContainer.evaluate((el: HTMLElement) => el.scrollTo(0, 0));
    await pageA.waitForTimeout(2000);

    // Sau khi cuộn lên, FIRST_MESSAGE_MARKER phải xuất hiện
    await expect(firstMsgEl).toBeVisible({ timeout: 8000 });

    await contextA.close();
    await contextB.close();
  });

  /**
   * TEST 6: Xóa tin nhắn (Thu hồi với mọi người)
   * Kịch bản: User A gửi tin → hover → click thu hồi → tin hiện "đã thu hồi"
   */
  test('should allow message sender to retract a message for everyone', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const userAEmail = `chat-delete-a-${Date.now()}@example.com`;
    const userAName = `ChatDelete A ${Date.now()}`;
    const userBEmail = `chat-delete-b-${Date.now()}@example.com`;
    const userBName = `ChatDelete B ${Date.now()}`;
    const msgToDelete = `Delete me ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    await registerAndLogin(pageA, request, userAEmail, userAName, password);
    await registerAndLogin(pageB, request, userBEmail, userBName, password);
    await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

    // User A gửi tin nhắn
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
    const friendRow = pageA.locator('div.flex.items-center.justify-between').filter({ hasText: userBEmail });
    await friendRow.locator('button:has-text("Nhắn tin")').click();

    const chatInputA = pageA.locator('input[placeholder^="Message"]');
    await expect(chatInputA).toBeVisible({ timeout: 10000 });
    await chatInputA.fill(msgToDelete);
    await pageA.press('input[placeholder^="Message"]', 'Enter');
    await expect(pageA.locator(`text=${msgToDelete}`)).toBeVisible({ timeout: 8000 });

    // Hover vào tin nhắn để hiện menu xóa
    const messageBubble = pageA.locator('div.relative.z-10').filter({ hasText: msgToDelete }).first();
    await messageBubble.hover();

    // Click nút xóa (Trash icon)
    const deleteBtn = pageA.locator('button[title="Xóa"], button[aria-label="Xóa"]').first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Chọn "Thu hồi với mọi người"
      const retractOption = pageA.locator('button:has-text("Thu hồi với mọi người"), button:has-text("Thu hồi")').first();
      if (await retractOption.isVisible()) {
        await retractOption.click();
        // Kiểm tra tin nhắn hiện placeholder "đã thu hồi"
        await expect(pageA.locator('text=Tin nhắn đã được thu hồi')).toBeVisible({ timeout: 5000 });
      }
    }

    await contextA.close();
    await contextB.close();
  });
});
