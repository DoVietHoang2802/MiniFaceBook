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

    await page.getByTestId('create-post-card').getByRole('button', { name: 'Bạn đang nghĩ gì thế?' }).click();
    const createPostDialog = page.getByTestId('create-post-dialog');
    const postInput = createPostDialog.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible({ timeout: 15000 });
    await postInput.fill(postContent);
    await createPostDialog.getByRole('button', { name: 'Đăng' }).click();

    const postCard = page
      .getByTestId('post-card')
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

    await page.getByTestId('create-post-card').getByRole('button', { name: 'Bạn đang nghĩ gì thế?' }).click();
    const createPostDialog = page.getByTestId('create-post-dialog');
    const postInput = createPostDialog.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible({ timeout: 15000 });
    await postInput.fill('Bài viết test cuộn trang');
    await createPostDialog.getByRole('button', { name: 'Đăng' }).click();

    const postCard = page
      .getByTestId('post-card')
      .filter({ hasText: 'Bài viết test cuộn trang' })
      .first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    const endMsg = page.locator('text=Bạn đã xem hết bài viết');
    const loadMore = page.getByTestId('feed-load-more');
    for (let i = 0; i < 25; i++) {
      if (await endMsg.isVisible()) break;
      await loadMore.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
    }

    await expect(endMsg).toBeVisible({ timeout: 12000 });
  });

  test('should handle nested comment replies and comment deletion cleanly', async ({ page, request }) => {
    const postContent = `Test Post for Reply ${Date.now()}`;
    const commentContent = `Parent Comment ${Date.now()}`;
    const replyContent = `Child Reply ${Date.now()}`;

    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('Bạn có chắc chắn muốn xóa')) {
        await dialog.accept();
      }
    });

    await registerAndLogin(page, request, 'replytest@example.com', 'Reply Tester', 'Password123!');
    await page.waitForTimeout(1000);

    await page.getByTestId('create-post-card').getByRole('button', { name: 'Bạn đang nghĩ gì thế?' }).click();
    const createPostDialog = page.getByTestId('create-post-dialog');
    const postInput = createPostDialog.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]');
    await expect(postInput).toBeVisible({ timeout: 15000 });
    await postInput.fill(postContent);
    await createPostDialog.getByRole('button', { name: 'Đăng' }).click();

    const postCard = page
      .getByTestId('post-card')
      .filter({ hasText: postContent })
      .first();
    await expect(postCard).toBeVisible({ timeout: 15000 });

    // Open detail modal
    await postCard.locator('button:has-text("Bình luận")').click();
    const detailModal = page.locator('div.fixed.inset-0.z-\\[99999\\]');
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    // Add parent comment
    const commentInput = detailModal.locator('textarea[placeholder="Viết bình luận..."]');
    await commentInput.fill(commentContent);
    await detailModal.locator('button.bg-blue-500').click();
    await expect(detailModal.locator(`text=${commentContent}`)).toBeVisible({ timeout: 10000 });

    // Click "Phản hồi" on parent comment
    const parentCommentContainer = detailModal.locator('div.group.animate-fade-in-up').filter({ hasText: commentContent }).first();
    await parentCommentContainer.locator('button:has-text("Phản hồi")').click();

    // Verify reply badge appears
    await expect(detailModal.locator('text=Đang trả lời')).toBeVisible({ timeout: 5000 });

    // Fill reply comment and submit
    const replyInput = detailModal.locator('textarea[placeholder*="Trả lời"]');
    await replyInput.fill(replyContent);
    await detailModal.locator('button.bg-blue-500').click();

    // Verify reply appears in modal
    await expect(detailModal.locator(`text=${replyContent}`)).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify comment count on PostCard (should show 2 bình luận)
    await expect(postCard.locator('button.hover\\:underline').filter({ hasText: 'bình luận' })).toContainText('2 bình luận', { timeout: 10000 });
  });
});
