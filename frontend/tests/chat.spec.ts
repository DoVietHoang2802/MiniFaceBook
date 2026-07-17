import { test, expect, type Page } from '@playwright/test';
import {
  registerAndLogin,
  appShell,
  friendsNav,
  chatsNav,
} from './helpers/e2e-auth';

async function waitForShell(page: Page) {
  await expect(appShell(page)).toBeVisible({ timeout: 30000 });
}

async function goFriends(page: Page) {
  await waitForShell(page);
  for (let i = 0; i < 3; i++) {
    try {
      await friendsNav(page).click({ timeout: 10000 });
      await expect(
        page.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
      ).toBeVisible({ timeout: 10000 });
      return;
    } catch (e: any) {
      console.warn(`goFriends attempt ${i + 1}: ${e.message}`);
      await page.reload();
      await waitForShell(page);
    }
  }
  await friendsNav(page).click();
  await expect(
    page.locator('input[placeholder="Nhập tên người bạn muốn tìm..."]')
  ).toBeVisible({ timeout: 10000 });
}

async function goChats(page: Page) {
  await waitForShell(page);
  for (let i = 0; i < 3; i++) {
    try {
      await chatsNav(page).click({ timeout: 10000 });
      await expect(
        page
          .locator('text=Chưa chọn cuộc trò chuyện nào')
          .or(page.locator('input[placeholder^="Message"], input[placeholder="Aa"]'))
          .first()
      ).toBeVisible({ timeout: 10000 });
      return;
    } catch (e: any) {
      console.warn(`goChats attempt ${i + 1}: ${e.message}`);
      await page.reload();
      await waitForShell(page);
    }
  }
  await chatsNav(page).click();
}

async function makeFriends(
  pageA: Page,
  pageB: Page,
  userAEmail: string,
  userBName: string,
  userBEmail: string
) {
  let sentRequest = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await goFriends(pageA);
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', '');
      await pageA.fill('input[placeholder="Nhập tên người bạn muốn tìm..."]', userBName);

      const searchRowA = pageA
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userBEmail });

      await expect(searchRowA).toBeVisible({ timeout: 15000 });

      if (await searchRowA.locator('button:has-text("Thu hồi")').isVisible()) {
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
      console.warn(`makeFriends send attempt ${attempt + 1}: ${e.message}`);
      await pageA.reload();
      await waitForShell(pageA);
    }
  }
  expect(sentRequest).toBe(true);

  let acceptedRequest = false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await goFriends(pageB);
      await pageB.click('button.rounded-t-lg:has-text("Lời mời")');

      const requestRowB = pageB
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userAEmail });

      if (attempt > 0 && (await requestRowB.count()) === 0) {
        acceptedRequest = true;
        break;
      }

      await expect(requestRowB).toBeVisible({ timeout: 15000 });
      await expect(requestRowB.locator('button:has-text("Chấp nhận")')).toBeVisible({
        timeout: 12000,
      });
      await requestRowB.locator('button:has-text("Chấp nhận")').click();
      await expect(requestRowB).not.toBeVisible({ timeout: 10000 });
      acceptedRequest = true;
      break;
    } catch (e: any) {
      console.warn(`makeFriends accept attempt ${attempt + 1}: ${e.message}`);
      await pageB.reload();
      await waitForShell(pageB);
    }
  }
  expect(acceptedRequest).toBe(true);
}

async function openChatWithFriend(pageA: Page, userBEmail: string) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await goFriends(pageA);

      const friendRow = pageA
        .locator('div.flex.items-center.justify-between')
        .filter({ hasText: userBEmail });

      let found = false;
      for (let i = 0; i < 5; i++) {
        await pageA.click('button.rounded-t-lg:has-text("Lời mời")');
        await pageA.waitForTimeout(400);
        await pageA.click('button.rounded-t-lg:has-text("Bạn bè")');
        try {
          await expect(friendRow).toBeVisible({ timeout: 2500 });
          found = true;
          break;
        } catch {
          /* retry tab switch */
        }
      }
      expect(found).toBe(true);

      await expect(friendRow.locator('button:has-text("Nhắn tin")')).toBeVisible({
        timeout: 8000,
      });
      await friendRow.locator('button:has-text("Nhắn tin")').click();

      const chatInput = pageA.locator(
        'input[placeholder^="Message"], input[placeholder="Aa"]'
      );
      await expect(chatInput).toBeVisible({ timeout: 20000 });
      return chatInput;
    } catch (e: any) {
      console.warn(`openChatWithFriend attempt ${attempt + 1}: ${e.message}`);
      await pageA.reload();
      await waitForShell(pageA);
    }
  }
  throw new Error('openChatWithFriend failed after retries');
}

async function messageBubble(page: Page, messageText: string) {
  return page
    .locator('div.relative.z-10')
    .filter({ hasText: messageText })
    .or(page.getByText(messageText, { exact: true }))
    .first();
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
      ).toBeVisible({ timeout: 10000 });

      await goChats(pageB);
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({
        timeout: 10000,
      });

      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      const userAChatItem = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(userAChatItem).toBeVisible({ timeout: 20000 });
      await userAChatItem.click();

      await expect(await messageBubble(pageB, messageText)).toBeVisible({ timeout: 15000 });
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

      await goChats(pageB);
      await expect(pageB.locator('text=Chưa chọn cuộc trò chuyện nào')).toBeVisible({
        timeout: 10000,
      });

      await chatInputA.fill(messageText);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');

      await expect(await messageBubble(pageA, messageText)).toBeVisible({ timeout: 15000 });

      const chatItemB = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: messageText.substring(0, 12) });
      await expect(chatItemB).toBeVisible({ timeout: 20000 });
      await chatItemB.click();
      await expect(await messageBubble(pageB, messageText)).toBeVisible({ timeout: 15000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('should show typing indicator when other user is typing', async ({
    browser,
    request,
  }) => {
    test.setTimeout(180000);
    const password = 'Password123!';
    const initMsg = `init-typing-${Date.now()}`;

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

      // Both open the same conversation before typing (WS must be subscribed)
      const chatInputA = await openChatWithFriend(pageA, userB.email);
      await chatInputA.fill(initMsg);
      await pageA.press('input[placeholder^="Message"], input[placeholder="Aa"]', 'Enter');
      await expect(await messageBubble(pageA, initMsg)).toBeVisible({ timeout: 15000 });

      await goChats(pageB);
      const chatItemB = pageB
        .locator('div.cursor-pointer')
        .filter({ hasText: initMsg.substring(0, 12) });
      await expect(chatItemB).toBeVisible({ timeout: 20000 });
      await chatItemB.click();

      const chatInputB = pageB.locator(
        'input[placeholder^="Message"], input[placeholder="Aa"]'
      );
      await expect(chatInputB).toBeVisible({ timeout: 15000 });
      // Wait for STOMP subscribe after opening the thread
      await pageB.waitForTimeout(2500);
      await expect(chatInputA).toBeVisible({ timeout: 10000 });

      // pressSequentially fires input/onChange per key (emitTyping); fill alone can miss race
      await chatInputA.click();
      await chatInputA.fill('');
      await chatInputA.pressSequentially('I am typing now...', { delay: 80 });

      // UI text is "Đang nhập..." (header/sidebar); bubble uses data-testid only
      const typingVisible = pageB
        .getByTestId('typing-indicator')
        .or(pageB.getByTestId('typing-status'))
        .or(pageB.getByText(/Đang nhập/i));
      await expect(typingVisible.first()).toBeVisible({ timeout: 30000 });
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
