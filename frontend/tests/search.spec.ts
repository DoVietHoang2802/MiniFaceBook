import { expect, test } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Post Search', () => {
  test('suggests matching posts and opens full results with Enter', async ({ page, request }) => {
    const token = `search-${Date.now()}`;
    const postContent = `Bài viết có từ khóa ${token}`;

    await registerAndLogin(page, request, 'searchtest@example.com', 'Search Tester', 'Password123!');

    await page.getByTestId('create-post-card').getByRole('button', { name: 'Bạn đang nghĩ gì thế?' }).click();
    const createPostDialog = page.getByTestId('create-post-dialog');
    await createPostDialog.locator('textarea[placeholder*="Bạn đang nghĩ gì thế"]').fill(postContent);
    await createPostDialog.getByRole('button', { name: 'Đăng' }).click();
    await expect(page.getByTestId('post-card').filter({ hasText: postContent }).first()).toBeVisible({ timeout: 15000 });

    const searchInput = page.getByRole('combobox', { name: 'Tìm bài viết' });
    await searchInput.fill(token);
    await expect(page.getByRole('option').filter({ hasText: postContent })).toBeVisible({ timeout: 15000 });
    await searchInput.press('Enter');

    await expect(page).toHaveURL(new RegExp(`/search\\?q=${encodeURIComponent(token)}`));
    await expect(page.getByTestId('post-card').filter({ hasText: postContent }).first()).toBeVisible({ timeout: 15000 });
  });
});
