import { expect, test } from '@playwright/test';
import { registerAndLogin } from './helpers/e2e-auth';

test.describe('Mobile responsive shell', () => {
  test('keeps navigation, profile, and notifications usable at 360px', async ({ page, request }) => {
    const user = await registerAndLogin(
      page,
      request,
      'mobile-shell@example.com',
      'Mobile Shell User',
      'Password123!'
    );

    const mobileHeader = page.getByTestId('mobile-header');
    const mobileNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileHeader).toBeVisible();
    await expect(mobileNav).toBeVisible();
    await expect(page.locator('header').filter({ has: page.locator('#header-notifications-btn') })).toBeHidden();

    const navItems = mobileNav.locator('button');
    await expect(navItems).toHaveCount(5);
    for (const item of await navItems.all()) {
      const box = await item.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const firstPost = page.getByTestId('post-card').first();
    const reactionButton = firstPost.getByRole('button', {
      name: 'Thích bài viết. Nhấn giữ để chọn cảm xúc',
    });
    await reactionButton.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      buttons: 1,
    });
    await page.waitForTimeout(500);
    await expect(firstPost.getByRole('button', { name: 'Yêu thích' })).toBeVisible();
    await reactionButton.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      buttons: 0,
    });

    await page.getByTestId('mobile-nav-profile').click();
    await page.waitForURL(/\/profile/);
    await expect(page.locator('h1').first()).toContainText(user.name.split(' ')[0]);
    await expect(page.getByRole('button', { name: 'Tìm bài viết' })).toBeHidden();

    const horizontalOverflow = await page.evaluate<number>(
      'document.documentElement.scrollWidth - document.documentElement.clientWidth'
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);

    await page.getByTestId('mobile-nav-notifications').click();
    const panel = page.getByTestId('notification-panel');
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();
    expect(panelBox!.x).toBeGreaterThanOrEqual(0);
    expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(360);
    expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(800);

    await panel.getByRole('button', { name: 'Đóng bảng thông báo' }).click();
    await expect(panel).toBeHidden();
  });

  test('uses a full-width single-pane chat list on mobile', async ({ page, request }) => {
    await registerAndLogin(
      page,
      request,
      'mobile-chat@example.com',
      'Mobile Chat User',
      'Password123!'
    );

    await page.getByTestId('mobile-nav-chats').click();
    await page.waitForURL(/\/chats$/);

    const chatList = page.getByTestId('chat-list');
    await expect(chatList).toBeVisible();
    await expect(page.getByTestId('chat-thread')).toBeHidden();
    await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();

    const listBox = await chatList.boundingBox();
    const mobileNavBox = await page.getByTestId('mobile-bottom-nav').boundingBox();
    expect(listBox).not.toBeNull();
    expect(mobileNavBox).not.toBeNull();
    expect(listBox!.x).toBe(0);
    expect(listBox!.width).toBe(360);
    // Chromium reports fractional layout pixels differently on GitHub runners.
    expect(listBox!.y + listBox!.height).toBeGreaterThanOrEqual(mobileNavBox!.y - 5);
    expect(listBox!.y + listBox!.height).toBeLessThanOrEqual(mobileNavBox!.y + 1);
  });

  test('uses a compact composer and moves logout into profile overflow actions', async ({ page, request }) => {
    await registerAndLogin(
      page,
      request,
      'mobile-composer@example.com',
      'Mobile Composer User',
      'Password123!'
    );

    const composer = page.getByTestId('create-post-card');
    const composerBox = await composer.boundingBox();
    expect(composerBox).not.toBeNull();
    expect(composerBox!.height).toBeLessThanOrEqual(140);
    await expect(composer.getByText('Check-in')).toBeHidden();
    await expect(composer.getByText('Thăm dò')).toBeHidden();

    await composer.getByRole('button', { name: 'Bạn đang nghĩ gì thế?' }).click();
    const dialog = page.getByTestId('create-post-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Check-in')).toBeHidden();
    await dialog.getByRole('button', { name: 'Thêm vào bài viết' }).click();
    await expect(dialog.getByRole('button', { name: /Check-in/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Khảo sát/ })).toBeVisible();
    await dialog.getByRole('button', { name: 'Đóng tạo bài viết' }).click();
    await expect(dialog).toBeHidden();

    await page.getByTestId('mobile-nav-profile').click();
    await page.waitForURL(/\/profile/);
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeHidden();
    await page.getByTestId('profile-more-actions').click();
    await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible();
  });
});
