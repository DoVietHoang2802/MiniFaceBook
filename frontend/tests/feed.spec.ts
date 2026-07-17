import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Feed and Post Interactions Flow', () => {
  test('should create, like, comment, and delete a post successfully', async ({
    page,
    request,
  }) => {
    const postContent = `Hello, this is a Playwright E2E post at ${Date.now()}`;
    const commentContent = `This is an E2E comment! ${Date.now()}`;

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Bạn có chắc chắn muốn xóa bài viết này không?');
      await dialog.accept();
    });

    await registerAndLogin(page, request, 'feedtest@example.com', 'Feed Tester', 'Password123!');
    await page.waitForTimeout(1000);

    const postInput = page.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible({ timeout: 15000 });
    await postInput.fill(postContent);
    await page.click('button:has-text("Đăng bài")');

    const postCard = page
      .locator('div.w-full.rounded-2xl.border.border-slate-200.bg-white')
      .filter({ hasText: postContent })
      .first();
    await expect(postCard).toBeVisible({ timeout: 15000 });

    await postCard.locator('button:has-text("Thích")').click();
    await expect(postCard.locator('span.ml-1')).toHaveText('1', { timeout: 10000 });

    await postCard.locator('button:has-text("Bình luận")').click();
    const detailModal = page.locator('div.fixed.inset-0.z-\\[99999\\]');
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    const commentInput = detailModal.locator('textarea[placeholder="Viết bình luận..."]');
    await expect(commentInput).toBeVisible();
    await commentInput.fill(commentContent);
    await detailModal.locator('button.bg-blue-500').click();
    await expect(detailModal.locator(`text=${commentContent}`)).toBeVisible({ timeout: 10000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(detailModal).not.toBeVisible({ timeout: 8000 });

    await postCard.locator('button[title="Tùy chọn bài viết"]').click();
    await page.locator('button:has-text("Xóa bài viết")').click();
    await expect(postCard).not.toBeVisible({ timeout: 10000 });
  });

  test('should load more posts on scroll (infinite scroll)', async ({ page, request }) => {
    await registerAndLogin(
      page,
      request,
      'scrolltest@example.com',
      'Scroll Tester',
      'Password123!'
    );

    const postInput = page.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible({ timeout: 15000 });
    await postInput.fill('Bài viết test cuộn trang');
    await page.click('button:has-text("Đăng bài")');

    const postCard = page
      .locator('div.w-full.rounded-2xl.border.border-slate-200.bg-white')
      .filter({ hasText: 'Bài viết test cuộn trang' })
      .first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    const endMsg = page.locator('text=Bạn đã xem hết bài viết');
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(500);
      if (await endMsg.isVisible()) break;
    }

    await expect(endMsg).toBeVisible({ timeout: 12000 });
  });
});
