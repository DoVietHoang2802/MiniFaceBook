import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

async function makeFriends(
  pageA: any,
  pageB: any,
  userAEmail: string,
  userBName: string,
  userBEmail: string
) {
  let sentRequest = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await pageA.click('aside button[title="Bạn bè"]');
      await expect(
        pageA.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
      ).toBeVisible({ timeout: 8000 });
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', '');
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);

      const searchRowA = pageA
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userBEmail });

      await expect(searchRowA).toBeVisible({ timeout: 12000 });

      const isAlreadySent = await searchRowA.locator('button:has-text("Thu hồi")').isVisible();
      if (isAlreadySent) {
        sentRequest = true;
        break;
      }

      await expect(searchRowA.locator('button:has-text("Kết bạn")')).toBeVisible({
        timeout: 8000,
      });
      await searchRowA.locator('button:has-text("Kết bạn")').click();
      await expect(searchRowA.locator('button:has-text("Thu hồi")')).toBeVisible({
        timeout: 10000,
      });
      sentRequest = true;
      break;
    } catch (e: any) {
      console.warn(`Attempt ${attempt + 1} to make friends failed: ${e.message}. Retrying...`);
      await pageA.reload();
      await pageA.waitForTimeout(2000);
    }
  }
  expect(sentRequest).toBe(true);

  let acceptedRequest = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await pageB.click('aside button[title="Bạn bè"]');
      await expect(
        pageB.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
      ).toBeVisible({ timeout: 8000 });
      await pageB.click('button.rounded-t-lg:has-text("Lời mời")');

      const requestRowB = pageB
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userAEmail });

      if (attempt > 0) {
        const count = await requestRowB.count();
        if (count === 0) {
          acceptedRequest = true;
          break;
        }
      } else {
        await expect(requestRowB).toBeVisible({ timeout: 15000 });
      }

      await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({
        timeout: 12000,
      });
      await requestRowB.locator('button:has-text("Chấp nhận")').click();
      await expect(requestRowB).not.toBeVisible({ timeout: 10000 });
      acceptedRequest = true;
      break;
    } catch (e: any) {
      console.warn(
        `Attempt ${attempt + 1} to accept friend request failed: ${e.message}. Retrying...`
      );
      await pageB.reload();
      await pageB.waitForTimeout(2000);
    }
  }
  expect(acceptedRequest).toBe(true);
}

async function openChatWithFriend(pageA: any, userBEmail: string) {
  await pageA.click('aside button[title="Bạn bè"]');
  await expect(
    pageA.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
  ).toBeVisible({ timeout: 8000 });

  const friendRow = pageA
    .locator('div.flex.items-center.justify-between')
    .filter({ hasText: userBEmail });

  let found = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    await pageA.click('button.rounded-t-lg:has-text("Lời mời")');
    await pageA.waitForTimeout(500);
    await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');

    try {
      await expect(friendRow).toBeVisible({ timeout: 2000 });
      found = true;
      break;
    } catch {
      console.warn(`Friend row not visible on attempt ${attempt + 1}. Retrying...`);
    }
  }
  expect(found).toBe(true);

  await expect(friendRow.locator('button:has-text("Nhắn tin")')).toBeVisible({ timeout: 8000 });
  await friendRow.locator('button:has-text("Nhắn tin")').click();

  const chatInput = pageA.locator('input[placeholder^="Message"], input[placeholder="Aa"]');
  await expect(chatInput).toBeVisible({ timeout: 15000 });
  return chatInput;
}

test.describe('Real-time Chat Flow', () => {
  test('should exchange real-time chat messages between two users successfully', async ({
    browser,
    request,
  }) => {
    const password = 'Password123!';
    const messageText = `Hi User B, E2E message at ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      const userA = await registerAndLogin(
        pageA,
        request,
        'chata@example.com',
        'Chat User A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'chatb@example.com',
        'Chat User B',
        password
      );
      await makeFriends(pageA, pageB, userA.email, userB.name, userB.email);

      const chatInputA = await openChatWithFriend(pageA, userB.email);
      await expect(
        pageA.locator('text=Bắt đầu gửi tin nhắn chào mừng bạn mới nhé!')
      ).toBeVisible({ timeout: 8000 });

      await pageB.click('aside button[title="Trò chuyện"]');
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({
        timeout: 8000,
      });

      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      const userAChatItem = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(userAChatItem).toBeVisible({ timeout: 15000 });
      await userAChatItem.click();

      await expect(
        pageB.locator('div.relative.z-10').filter({ hasText: messageText })
      ).toBeVisible({ timeout: 8000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});

test.describe('Chat Page - UI After Refactoring', () => {
  test('should NOT show standalone search button in chat header after sending a message', async ({
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
        'nosearch-a@example.com',
        'NoSearch A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'nosearch-b@example.com',
        'NoSearch B',
        password
      );
      await makeFriends(pageA, pageB, userA.email, userB.name, userB.email);
      await openChatWithFriend(pageA, userB.email);

      const standaloneSearch = pageA.locator(
        'button[aria-label="Tìm kiếm tin nhắn"], button[title="Tìm kiếm tin nhắn"]'
      );
      await expect(standaloneSearch).not.toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should NOT show conversation options button in chat header', async ({
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
        'noopts-a@example.com',
        'NoOpts A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'noopts-b@example.com',
        'NoOpts B',
        password
      );
      await makeFriends(pageA, pageB, userA.email, userB.name, userB.email);
      await openChatWithFriend(pageA, userB.email);

      const optionsBtn = pageA.locator(
        'button[aria-label="Tùy chọn hội thoại"], button[title="Tùy chọn hội thoại"]'
      );
      await expect(optionsBtn).not.toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should send and receive messages in real time', async ({ browser, request }) => {
    const password = 'Password123!';
    const messageText = `E2E test message ${Date.now()}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();

    try {
      const userA = await registerAndLogin(
        pageA,
        request,
        'sendmsg-a@example.com',
        'SendMsg A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'sendmsg-b@example.com',
        'SendMsg B',
        password
      );
      await makeFriends(pageA, pageB, userA.email, userB.name, userB.email);

      const chatInputA = await openChatWithFriend(pageA, userB.email);

      await pageB.click('aside button[title="Trò chuyện"]');
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({
        timeout: 8000,
      });

      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      await expect(
        pageA.locator('div.relative.z-10').filter({ hasText: messageText })
      ).toBeVisible({ timeout: 8000 });

      const chatItemB = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(chatItemB).toBeVisible({ timeout: 12000 });
      await chatItemB.click();
      await expect(
        pageB.locator('div.relative.z-10').filter({ hasText: messageText })
      ).toBeVisible({ timeout: 8000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should show typing indicator when other user is typing', async ({
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
        'typing-a@example.com',
        'Typing A',
        password
      );
      const userB = await registerAndLogin(
        pageB,
        request,
        'typing-b@example.com',
        'Typing B',
        password
      );
      await makeFriends(pageA, pageB, userA.email, userB.name, userB.email);

      const chatInputA = await openChatWithFriend(pageA, userB.email);
      await chatInputA.fill('init');
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');
      await pageA.waitForTimeout(1500);

      await pageB.click('aside button[title="Trò chuyện"]');
      const chatItemB = pageB.locator('div.cursor-pointer').filter({ hasText: 'init' });
      await expect(chatItemB).toBeVisible({ timeout: 12000 });
      await chatItemB.click();

      const chatInputB = pageB.locator(
        'input[placeholder^="Message"], input[placeholder="Aa"]'
      );
      await expect(chatInputB).toBeVisible({ timeout: 8000 });
      await pageB.waitForTimeout(1000);

      await chatInputA.fill('I am typing now...');
      await expect(pageB.locator('text=đang nhập').first()).toBeVisible({ timeout: 10000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
