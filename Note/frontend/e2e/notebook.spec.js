import { test, expect } from '@playwright/test';
import { rm, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dataDir = process.env.NOTEAPP_E2E_DATA_DIR;
if (!dataDir || !path.basename(dataDir).startsWith('noteapp-e2e-')) throw new Error('E2E requires a dedicated temporary notebook.');
const api = 'http://127.0.0.1:5000/api';
const titleInput = (page) => page.getByRole('textbox', { name: 'Tên tài liệu', exact: true });
const editor = (page) => page.getByRole('textbox', { name: 'Nội dung tài liệu', exact: true });

test.beforeEach(async () => { await rm(dataDir, { recursive: true, force: true }); await mkdir(dataDir, { recursive: true }); });

test('opens the notebook directly; old login/register URLs redirect without a form', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const url of ['/', '/login', '/register']) {
    await page.goto(url);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Ghi chú mới', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('erasing profile and notes recovers a usable empty screen after reload', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Ghi chú mới', exact: true })).toBeVisible();
  for (const content of ['', ' \n\t', '{}']) {
    await writeFile(path.join(dataDir, 'profile.json'), content);
    await rm(path.join(dataDir, 'notes'), { recursive: true, force: true });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Ghi chú mới', exact: true })).toBeVisible();
    expect(await (await request.get(`${api}/notes`)).json()).toEqual([]);
    await expect(page.getByRole('alert')).toHaveCount(0);
  }
});

test('spaces-only title is rejected by UI without saving an empty note', async ({ page, request }) => {
  await page.goto('/dashboard?new=1');
  await titleInput(page).fill('     ');
  await editor(page).fill('Nội dung');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByText('Vui lòng nhập tiêu đề ghi chú, không chỉ gồm khoảng trắng.', { exact: true })).toBeVisible();
  expect(await (await request.get(`${api}/notes`)).json()).toEqual([]);
});

test('Vietnamese title/body remain intact through composition, format rerenders, save and reload', async ({ page, request }) => {
  await page.goto('/dashboard?new=1');
  const title = 'Tiếng Việt: Đắk Lắk, trường đại học';
  await titleInput(page).fill(title);
  await editor(page).click();
  // Exercise real browser IME composition through Chrome DevTools. This checks
  // DOM handling; native Windows UniKey/EVKey still needs a manual Telex check.
  const cdp = await page.context().newCDPSession(page);
  for (const text of ['Tie', 'Tiế', 'Tiếng Việt đầy đủ dấu']) {
    await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
    await expect(editor(page)).toContainText(text);
  }
  await cdp.send('Input.insertText', { text: 'Tiếng Việt đầy đủ dấu' });
  await expect(editor(page)).toContainText('Tiếng Việt đầy đủ dấu');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect.poll(async () => (await (await request.get(`${api}/notes`)).json()).length).toBe(1);
  await page.goto('/notes/ghi-chu?view=notebook');
  await page.getByRole('button', { name: title, exact: false }).first().click();
  await expect(titleInput(page)).toHaveValue(title);
  await expect(editor(page)).toContainText('Tiếng Việt đầy đủ dấu');
});

test('private wrong-password limit is visible, persists after reload and expires without hiding regular notes', async ({ page, request }) => {
  expect((await request.post(`${api}/auth/setup-private-password`, { data: { privatePassword: 'test-secret' } })).ok()).toBe(true);
  await page.goto('/private-notes');
  for (let attempt = 1; attempt <= 6; attempt++) {
    await page.getByLabel('Mật khẩu riêng tư', { exact: true }).fill('wrong-secret');
    await page.getByRole('button', { name: 'Mở Khóa', exact: true }).click();
    if (attempt < 6) await expect(page.getByRole('alert')).toContainText(`Còn ${6 - attempt} lần thử`);
  }
  await expect(page.getByRole('button', { name: 'Mở Khóa', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Vùng riêng tư tạm khóa');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Mở Khóa', exact: true })).toBeDisabled();
  await page.goto('/dashboard');
  await expect(page.getByRole('button', { name: 'Ghi chú mới', exact: true })).toBeVisible();
  // Advance the fixture's lock timestamp instead of waiting ten minutes.
  await writeFile(path.join(dataDir, 'private-attempts.json'), JSON.stringify({ failedAttempts: 6, lockedUntil: Date.now() - 1 }));
  await page.goto('/private-notes');
  await page.getByLabel('Mật khẩu riêng tư', { exact: true }).fill('test-secret');
  await page.getByRole('button', { name: 'Mở Khóa', exact: true }).click();
  await expect(page.getByText('Ghi chú riêng tư đang khóa', { exact: true })).toHaveCount(0);
});

test('profile and theme persist after F5; page has no horizontal overflow', async ({ page }) => {
  await page.goto('/settings?tab=profile');
  await page.getByLabel('Tên hiển thị', { exact: true }).fill('Anh Khoa');
  await page.getByRole('button', { name: /Lưu hồ sơ/ }).click();
  await page.goto('/settings?tab=appearance');
  await page.getByRole('button', { name: 'Tối', exact: true }).click();
  await page.getByRole('button', { name: /Lưu giao diện/ }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto('/settings?tab=profile');
  await expect(page.getByLabel('Tên hiển thị', { exact: true })).toHaveValue('Anh Khoa');
});
