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
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1500);
    try {
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
    } catch (e: any) {
      console.warn(`Mailpit fetch attempt ${i + 1} failed: ${e.message}. Retrying...`);
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
// Helper: Kết bạn giữa 2 users, trả về sau khi B chấp nhận
// ============================================================
async function makeFriends(
  pageA: any,
  pageB: any,
  userAEmail: string,
  userBName: string,
  userBEmail: string
) {
  // User A tìm và gửi lời mời kết bạn
  await pageA.click('aside button[title="Bạn bè"]');
  await expect(pageA.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')).toBeVisible({ timeout: 8000 });
  await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);
  
  const searchRowA = pageA
    .locator('div.flex.items-center.justify-between')
    .filter({ hasText: userBEmail });
  await expect(searchRowA.locator('button:has-text("Kết bạn")')).toBeVisible({ timeout: 12000 });
  await searchRowA.locator('button:has-text("Kết bạn")').click();
  await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible({ timeout: 8000 });

  // User B chấp nhận lời mời
  await pageB.click('aside button[title="Bạn bè"]');
  await expect(pageB.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')).toBeVisible({ timeout: 8000 });
  await pageB.click('button.rounded-t-lg:has-text("Lời mời")');
  
  const requestRowB = pageB
    .locator('div.flex.items-center.justify-between')
    .filter({ hasText: userAEmail });
  await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({ timeout: 12000 });
  await requestRowB.locator('button:has-text("Chấp nhận")').click();
  
  // Chờ cho dòng yêu cầu kết bạn biến mất khỏi danh sách của B
  await expect(requestRowB).not.toBeVisible({ timeout: 8000 });
}

// ============================================================
// Helper: Mở chat với User B từ FriendsPage của User A
// ============================================================
async function openChatWithFriend(pageA: any, userBEmail: string) {
  // Điều hướng sang tab Bạn bè → sub-tab Bạn bè
  await pageA.click('aside button[title="Bạn bè"]');
  await expect(pageA.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')).toBeVisible({ timeout: 8000 });
  await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');

  // Tìm hàng bạn bè theo email và click Nhắn tin
  const friendRow = pageA
    .locator('div.flex.items-center.justify-between')
    .filter({ hasText: userBEmail });
  await expect(friendRow.locator('button:has-text("Nhắn tin")')).toBeVisible({ timeout: 10000 });
  await friendRow.locator('button:has-text("Nhắn tin")').click();

  // Chờ chat input xuất hiện
  const chatInput = pageA.locator('input[placeholder^="Message"], input[placeholder="Aa"]');
  await expect(chatInput).toBeVisible({ timeout: 12000 });
  return chatInput;
}

// ============================================================
// Test Suite 1: Real-time Chat Flow (giữ lại test gốc đã pass)
// ============================================================
test.describe('Real-time Chat Flow', () => {
  test('should exchange real-time chat messages between two users successfully', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const userAEmail = `chata-${ts}@example.com`;
    const userAName = `Chat User A ${ts}`;
    const userBEmail = `chatb-${ts}@example.com`;
    const userBName = `Chat User B ${ts}`;
    const password = 'Password123!';
    const messageText = `Hi User B, E2E message at ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);
      await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

      // User A mở chat với User B
      const chatInputA = await openChatWithFriend(pageA, userBEmail);
      await expect(pageA.locator('text=Bắt đầu gửi tin nhắn chào mừng bạn mới nhé!')).toBeVisible({ timeout: 8000 });

      // User B mở trang Trò chuyện
      await pageB.click('aside button[title="Trò chuyện"]');
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({ timeout: 8000 });

      // User A gửi tin nhắn
      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      // User B nhận tin nhắn và mở chat
      const userAChatItem = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(userAChatItem).toBeVisible({ timeout: 15000 });
      await userAChatItem.click();

      // Xác thực nội dung tin nhắn bên User B
      await expect(
        pageB.locator('div.relative.z-10').filter({ hasText: messageText })
      ).toBeVisible({ timeout: 8000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

// ============================================================
// Test Suite 2: ChatPage UI After Refactoring
// ============================================================
test.describe('Chat Page - UI After Refactoring', () => {
  /**
   * TEST 1: Không có nút search tròn trong chat header
   */
  test('should NOT show standalone search button in chat header after sending a message', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const password = 'Password123!';
    const userAEmail = `nosearch-a-${ts}@example.com`;
    const userAName = `NoSearch A ${ts}`;
    const userBEmail = `nosearch-b-${ts}@example.com`;
    const userBName = `NoSearch B ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);
      await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

      await openChatWithFriend(pageA, userBEmail);

      // Không còn nút search standalone với aria-label/title "Tìm kiếm"
      const standaloneSearch = pageA.locator(
        'button[aria-label="Tìm kiếm tin nhắn"], button[title="Tìm kiếm tin nhắn"]'
      );
      await expect(standaloneSearch).not.toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  /**
   * TEST 2: Không có nút Tùy chọn hội thoại trong chat header
   */
  test('should NOT show conversation options button in chat header', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const password = 'Password123!';
    const userAEmail = `noopts-a-${ts}@example.com`;
    const userAName = `NoOpts A ${ts}`;
    const userBEmail = `noopts-b-${ts}@example.com`;
    const userBName = `NoOpts B ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);
      await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

      await openChatWithFriend(pageA, userBEmail);

      // Nút Tùy chọn hội thoại đã bị xóa
      const optionsBtn = pageA.locator(
        'button[aria-label="Tùy chọn hội thoại"], button[title="Tùy chọn hội thoại"]'
      );
      await expect(optionsBtn).not.toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  /**
   * TEST 3: Gửi tin nhắn thành công (2 chiều)
   */
  test('should send and receive messages in real time', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const password = 'Password123!';
    const userAEmail = `sendmsg-a-${ts}@example.com`;
    const userAName = `SendMsg A ${ts}`;
    const userBEmail = `sendmsg-b-${ts}@example.com`;
    const userBName = `SendMsg B ${ts}`;
    const messageText = `E2E test message ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);
      await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

      const chatInputA = await openChatWithFriend(pageA, userBEmail);

      // User B mở chat
      await pageB.click('aside button[title="Trò chuyện"]');
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({ timeout: 8000 });

      // Gửi tin nhắn
      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      // Phía A thấy tin nhắn
      await expect(pageA.locator('div.relative.z-10').filter({ hasText: messageText })).toBeVisible({ timeout: 8000 });

      // Phía B thấy tin nhắn trong sidebar
      const chatItemB = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(chatItemB).toBeVisible({ timeout: 12000 });
      await chatItemB.click();
      await expect(pageB.locator('div.relative.z-10').filter({ hasText: messageText })).toBeVisible({ timeout: 8000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  /**
   * TEST 4: Typing indicator hiển thị khi đối phương đang gõ
   */
  test('should show typing indicator when other user is typing', async ({
    browser,
    request,
  }) => {
    const ts = Date.now();
    const password = 'Password123!';
    const userAEmail = `typing-a-${ts}@example.com`;
    const userAName = `Typing A ${ts}`;
    const userBEmail = `typing-b-${ts}@example.com`;
    const userBName = `Typing B ${ts}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      await registerAndLogin(pageA, request, userAEmail, userAName, password);
      await registerAndLogin(pageB, request, userBEmail, userBName, password);
      await makeFriends(pageA, pageB, userAEmail, userBName, userBEmail);

      // User A mở chat và gửi 1 tin để tạo conversation
      const chatInputA = await openChatWithFriend(pageA, userBEmail);
      await chatInputA.fill('init');
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');
      await pageA.waitForTimeout(1500);

      // User B tìm và mở conversation
      await pageB.click('aside button[title="Trò chuyện"]');
      const chatItemB = pageB.locator('div.cursor-pointer').filter({ hasText: 'init' });
      await expect(chatItemB).toBeVisible({ timeout: 12000 });
      await chatItemB.click();

      // Đợi khung chat của B hiện lên (để đảm bảo B đã subscribe socket nhận sự kiện gõ)
      const chatInputB = pageB.locator('input[placeholder^="Message"], input[placeholder="Aa"]');
      await expect(chatInputB).toBeVisible({ timeout: 8000 });
      await pageB.waitForTimeout(1000);

      // User A bắt đầu gõ → B thấy "đang nhập"
      await chatInputA.fill('I am typing now...');
      await expect(pageB.locator('text=đang nhập').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
