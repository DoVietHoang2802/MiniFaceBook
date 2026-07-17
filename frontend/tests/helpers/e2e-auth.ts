import { expect, type APIRequestContext, type Page } from '@playwright/test';

const MAILPIT_BASE = 'http://localhost:8025/api/v1';
const API_BASE = 'http://localhost:8080/api';

export type E2EUser = {
  email: string;
  name: string;
  password: string;
};

/** Marker that the main app shell is ready (works even if left aside is delayed). */
export function appShell(page: Page) {
  return page.locator('#header-notifications-btn, button[title="Trang cá nhân"]').first();
}

export function friendsNav(page: Page) {
  return page.locator('aside button[title="Bạn bè"], button[title="Bạn bè"]').first();
}

export function chatsNav(page: Page) {
  return page.locator('aside button[title="Trò chuyện"], button[title="Trò chuyện"], header button[title="Trò chuyện"]').first();
}

async function waitForVerificationToken(
  request: APIRequestContext,
  email: string
): Promise<string> {
  let token = '';
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const listResponse = await request.get(`${MAILPIT_BASE}/messages`);
      if (!listResponse.ok()) continue;

      const listData = await listResponse.json();
      const latestMsg = listData.messages?.find(
        (msg: { To?: { Address?: string }[]; Subject?: string; ID?: number }) =>
          msg.To?.[0]?.Address === email && msg.Subject?.includes('Verify your email')
      );
      if (!latestMsg) continue;

      const detailResponse = await request.get(`${MAILPIT_BASE}/message/${latestMsg.ID}`);
      if (!detailResponse.ok()) continue;

      const detailData = await detailResponse.json();
      const body = `${detailData.HTML || ''}${detailData.Text || ''}`;
      const match = body.match(/token=([a-zA-Z0-9-_.]+)/);
      if (match?.[1]) {
        token = match[1];
        break;
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Mailpit fetch attempt ${i + 1} failed: ${message}`);
    }
  }
  return token;
}

async function verifyEmail(request: APIRequestContext, token: string): Promise<void> {
  let verified = false;
  for (let i = 0; i < 5; i++) {
    try {
      const verifyResponse = await request.get(`${API_BASE}/auth/verify?token=${token}`);
      if (verifyResponse.ok()) {
        verified = true;
        break;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  expect(verified).toBe(true);
}

export async function ensureLoggedOut(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto('/');
}

export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await ensureLoggedOut(page);

      // Already on shell after weird redirect
      if (await appShell(page).isVisible().catch(() => false)) {
        return;
      }

      await expect(page.locator('#login-email')).toBeVisible({ timeout: 20000 });
      await page.fill('#login-email', email);
      await page.fill('#login-password', password);
      await page.click('button[type="submit"]');
      await expect(appShell(page)).toBeVisible({ timeout: 30000 });
      return;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Login attempt ${attempt + 1} failed: ${message}`);
    }
  }
  await expect(appShell(page)).toBeVisible({ timeout: 30000 });
}

/**
 * Register a unique user, verify via Mailpit, then login.
 * Retries registration with a fresh email if Mailpit never receives the message.
 */
export async function registerAndLogin(
  page: Page,
  request: APIRequestContext,
  baseEmail: string,
  baseName: string,
  password: string
): Promise<E2EUser> {
  let token = '';
  let finalEmail = baseEmail;
  let finalName = baseName;

  for (let regAttempt = 0; regAttempt < 3; regAttempt++) {
    const ts = Date.now() + Math.floor(Math.random() * 1000);
    const prefix = baseEmail.split('@')[0];
    finalEmail = `${prefix}-${ts}@example.com`;
    finalName = `${baseName} ${ts}`;

    try {
      await ensureLoggedOut(page);
      await page.click('a:has-text("Đăng ký miễn phí")');
      await expect(page.locator('h2')).toHaveText('Tạo tài khoản mới', { timeout: 15000 });
      await page.fill('#register-name', finalName);
      await page.fill('#register-email', finalEmail);
      await page.fill('#register-password', password);
      await page.fill('#register-confirm', password);
      await page.click('button[type="submit"]');
      await expect(page.locator('h2')).toHaveText('Chào mừng trở lại', { timeout: 15000 });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn(`Registration attempt ${regAttempt + 1} failed: ${message}`);
    }

    token = await waitForVerificationToken(request, finalEmail);
    if (token) break;
    console.warn(`No verification email for ${finalEmail}. Retrying registration...`);
  }

  expect(token).not.toBe('');
  await verifyEmail(request, token);
  await loginAs(page, finalEmail, password);
  return { email: finalEmail, name: finalName, password };
}
