const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const fs = require('fs-extra');

// These tests never erase the developer's real data folder.
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'noteapp-test-'));
process.env.NOTEAPP_DATA_DIR = temporary;
const app = require('../server');
const { attemptsPath, LOCK_DURATION_MS } = require('../utils/privateAttempts');
let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(() => fs.emptyDir(temporary));
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.remove(temporary);
});

const request = async (url, method = 'GET', body, privateToken) => {
  const response = await fetch(`${base}${url}`, { method,
    headers: { 'Content-Type': 'application/json', ...(privateToken ? { 'X-Private-Token': privateToken } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json(), retryAfter: response.headers.get('retry-after') };
};
const setup = async () => {
  const result = await request('/auth/setup-private-password', 'POST', { privatePassword: 'old-secret' });
  assert.equal(result.status, 200);
  return result.body.privateToken;
};

test('new notebook opens without login and creates missing profile and notes', async () => {
  const profile = await request('/users/profile');
  assert.equal(profile.status, 200);
  assert.equal(profile.body.user.displayName, 'Sổ tay cá nhân');
  assert.equal('passwordHash' in profile.body.user, false);
  assert.equal(await fs.pathExists(path.join(temporary, 'profile.json')), true);
  assert.equal(await fs.pathExists(path.join(temporary, 'notes')), true);
  for (const url of ['/notes', '/notes/topics', '/notes/trash']) assert.deepEqual((await request(url)).body, []);
  assert.equal((await request('/auth/private-status')).body.hasSetup, false);
  for (const url of ['/auth/login', '/auth/register', '/auth/change-account-password']) {
    assert.equal((await request(url, 'POST', {})).status, 404);
  }
});

test('blank, whitespace, empty-object and deleted profile recover without 500; deleted notes return []', async () => {
  await request('/users/profile');
  for (const value of ['', '   \n\t', '{}', null]) {
    if (value === null) await fs.remove(path.join(temporary, 'profile.json'));
    else await fs.writeFile(path.join(temporary, 'profile.json'), value);
    await fs.remove(path.join(temporary, 'notes'));
    assert.equal((await request('/users/profile')).status, 200);
    assert.deepEqual((await request('/notes')).body, []);
    assert.deepEqual((await request('/notes/topics')).body, []);
  }
});

test('blank topic and trash files are empty lists and the next note creates valid JSON', async () => {
  await request('/users/profile');
  for (const file of ['notes/hoc-tap.json', 'trash.json']) await fs.outputFile(path.join(temporary, file), ' \n');
  assert.deepEqual((await request('/notes/hoc-tap')).body, []);
  assert.deepEqual((await request('/notes/trash')).body, []);
  const saved = await request('/notes/hoc-tap', 'POST', { title: 'Tiếng Việt', content: '<p>Đầy đủ dấu</p>' });
  assert.equal(saved.status, 201);
  assert.equal((await fs.readJson(path.join(temporary, 'notes/hoc-tap.json')))[0].title, 'Tiếng Việt');
});

test('reject blank and space-only titles on create/update without changing saved notes', async () => {
  for (const title of ['', '     ', '\t\n', '\u00a0\u2003', {}, 'A'.repeat(161)]) {
    assert.equal((await request('/notes/hoc-tap', 'POST', { title, content: '' })).status, 400);
  }
  assert.equal((await request('/notes/hoc-tap', 'POST', {})).status, 400);
  assert.deepEqual((await request('/notes/hoc-tap')).body, []);
  const saved = (await request('/notes/hoc-tap', 'POST', { title: 'Giữ lại', content: 'Nội dung' })).body.note;
  assert.equal((await request(`/notes/hoc-tap/${saved.id}`, 'PUT', { title: '   ' })).status, 400);
  assert.equal((await request('/notes/hoc-tap')).body[0].title, 'Giữ lại');
});

test('regular CRUD persists Vietnamese, topic boundaries, favorite/pin flags and trash restore', async () => {
  const created = await request('/notes/hoc-tap', 'POST', { title: '  Tiếng Việt  ', content: '<p>Trường đại học, Đắk Lắk</p>', isPinned: true, isFavorite: true });
  assert.equal(created.status, 201);
  const note = created.body.note;
  assert.equal(note.title, 'Tiếng Việt');
  assert.deepEqual((await request('/notes/cong-viec')).body, []);
  assert.equal((await request(`/notes/cong-viec/${note.id}`, 'PUT', { title: 'Sai chủ đề' })).status, 404);
  const updated = await request(`/notes/hoc-tap/${note.id}`, 'PUT', { content: '<p>Đã sửa</p>', isFavorite: false });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.note.isPinned, true);
  assert.equal(updated.body.note.isFavorite, false);
  assert.equal((await request(`/notes/hoc-tap/${note.id}`, 'DELETE')).status, 200);
  assert.deepEqual((await request('/notes/hoc-tap')).body, []);
  assert.equal((await request('/notes/trash')).body[0].id, note.id);
  assert.equal((await request(`/notes/trash/${note.id}/restore`, 'POST')).status, 200);
  assert.equal((await request('/notes/hoc-tap')).body[0].id, note.id);
});

test('profile/preferences persist partial edits; invalid input cannot overwrite saved settings', async () => {
  await request('/users/profile');
  const result = await request('/users/profile', 'PUT', { displayName: 'Anh Khoa', email: 'khoa@example.com', preferences: { theme: 'dark' } });
  assert.equal(result.status, 200);
  assert.equal((await request('/users/preferences', 'PATCH', { density: 'compact', noteLayout: 'grid' })).status, 200);
  const reloaded = (await request('/users/profile')).body;
  assert.equal(reloaded.user.displayName, 'Anh Khoa');
  assert.equal(reloaded.preferences.theme, 'dark');
  assert.equal(reloaded.preferences.density, 'compact');
  for (const body of [{ displayName: ' ' }, { email: 'bad email' }, { avatarDataUrl: {} }, { preferences: { theme: 'other' } }]) {
    assert.equal((await request('/users/profile', 'PUT', body)).status, 400);
    assert.deepEqual((await request('/users/profile')).body, reloaded);
  }
});

test('private endpoints and legacy private URLs require a private grant even without account login', async () => {
  for (const prefix of ['/private/notes', '/notes/private']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
      const result = await request(`${prefix}${['PUT', 'DELETE'].includes(method) ? '/missing' : ''}`, method, method === 'GET' ? undefined : {});
      assert.equal(result.status, 403);
      assert.equal(result.body.code, 'PRIVATE_LOCKED');
    }
  }
  const token = await setup();
  assert.deepEqual((await request('/private/notes', 'GET', undefined, token)).body, []);
  assert.equal((await request('/private/notes', 'GET', undefined, 'invalid')).status, 403);
  assert.equal((await request('/auth/setup-private-password', 'POST', { privatePassword: 'replace-secret' })).status, 409);
});

test('sixth wrong password locks 10 minutes, blocks valid passwords and grants, survives module/process restart', async () => {
  const token = await setup();
  for (let attempt = 1; attempt <= 6; attempt++) {
    const result = await request('/private/auth', 'POST', { password: 'wrong-secret' });
    assert.equal(result.status, attempt <= 5 ? 401 : 429);
    if (attempt <= 5) assert.equal(result.body.attemptsRemaining, 6 - attempt);
    else {
      assert.equal(result.body.code, 'PRIVATE_RATE_LIMITED');
      assert.ok(result.body.retryAfterSeconds > 595 && result.body.retryAfterSeconds <= 600);
      assert.ok(Number(result.retryAfter) > 595);
    }
  }
  assert.equal((await request('/private/auth', 'POST', { password: 'old-secret' })).status, 429);
  assert.equal((await request('/private/notes', 'GET', undefined, token)).status, 429);
  assert.equal((await request('/auth/change-private-password', 'PUT', {})).status, 429);
  const restarted = spawnSync(process.execPath, ['-e', "require('./utils/privateAttempts').getPrivateAttemptStatus().then(s => console.log(JSON.stringify(s)))"], { cwd: path.join(__dirname, '..'), env: process.env, encoding: 'utf8' });
  assert.equal(restarted.status, 0, restarted.stderr);
  assert.equal(JSON.parse(restarted.stdout.trim()).failedAttempts, 6);
  assert.deepEqual((await request('/notes')).body, []); // Regular notebook remains usable.
});

test('parallel wrong passwords cannot bypass the attempt counter; an expired lock resets attempts', async () => {
  await setup();
  const results = await Promise.all(Array.from({ length: 8 }, () => request('/private/auth', 'POST', { password: 'wrong-secret' })));
  assert.equal(results.filter((result) => result.status === 401).length, 5);
  assert.equal(results.filter((result) => result.status === 429).length, 3);
  await fs.writeJson(attemptsPath, { failedAttempts: 6, lockedUntil: Date.now() - LOCK_DURATION_MS });
  const unlocked = await request('/private/auth', 'POST', { password: 'old-secret' });
  assert.equal(unlocked.status, 200);
  assert.equal((await fs.readJson(attemptsPath)).failedAttempts, 0);
  assert.equal((await request('/private/auth', 'POST', { password: 'wrong-secret' })).body.attemptsRemaining, 5);
});

test('successful authentication resets failures, and changing-password failures share the same limit', async () => {
  await setup();
  for (let i = 0; i < 5; i++) assert.equal((await request('/private/auth', 'POST', { password: 'wrong' })).status, 401);
  assert.equal((await request('/private/auth', 'POST', { password: 'old-secret' })).status, 200);
  for (let i = 0; i < 6; i++) {
    const result = await request('/auth/change-private-password', 'PUT', { currentPassword: 'wrong', newPassword: 'new-secret', encryptedNotes: [] });
    assert.equal(result.status, i < 5 ? 401 : 429);
  }
});

test('private CRUD keeps metadata and trash separate; password rotation revokes the old grant', async () => {
  const token = await setup();
  const note = (await request('/private/notes', 'POST', { title: 'encrypted-title', content: 'encrypted-content', metadata: 'encrypted-metadata' }, token)).body.note;
  assert.equal((await request(`/private/notes/${note.id}`, 'PUT', { content: 'updated' }, token)).status, 200);
  assert.equal((await request('/private/notes', 'GET', undefined, token)).body[0].metadata, 'encrypted-metadata');
  assert.equal((await request(`/private/notes/${note.id}`, 'DELETE', undefined, token)).status, 200);
  assert.deepEqual((await request('/notes/trash')).body, []);
  const changed = await request('/auth/change-private-password', 'PUT', { currentPassword: 'old-secret', newPassword: 'new-secret', encryptedNotes: [], encryptedPrivateTrashNotes: [{ id: note.id, title: 'new-title', content: 'new-content', metadata: 'new-metadata' }] });
  assert.equal(changed.status, 200);
  assert.equal((await request('/private/trash', 'GET', undefined, token)).status, 403);
  const newToken = (await request('/private/auth', 'POST', { password: 'new-secret' })).body.privateToken;
  assert.equal((await request(`/private/trash/${note.id}/restore`, 'POST', {}, newToken)).status, 200);
  assert.equal((await request('/private/notes', 'GET', undefined, newToken)).body[0].metadata, 'new-metadata');
});

test('formatting and attachment remove chips persist; removing files clears embedded data', async () => {
  const id = 'file_abcdef123';
  const attachment = { id, name: 'Tài liệu.txt', dataUrl: 'data:text/plain;base64,aGVsbG8=' };
  const note = (await request('/notes/ghi-chu', 'POST', { title: 'Đính kèm', content: `<p style="text-align:center">Tiếng Việt</p><span class="note-file-chip"><a class="note-file-link" href="#note-file-${id}">Tài liệu</a><button type="button" class="note-file-remove" data-file-id="${id}">×</button></span>`, attachments: [attachment] })).body.note;
  assert.match(note.content, /note-file-remove/);
  assert.match(note.content, /text-align:center/);
  assert.equal(note.attachments[0].dataUrl, attachment.dataUrl);
  assert.equal((await request(`/notes/ghi-chu/${note.id}`, 'PUT', { content: '<p>Đã gỡ</p>', attachments: [] })).status, 200);
  const saved = (await request('/notes/ghi-chu')).body[0];
  assert.deepEqual(saved.attachments, []);
  assert.doesNotMatch(saved.content, /note-file/);
});

test('single legacy notebook is imported once without deleting its source or reviving deleted profile data', async () => {
  const legacy = path.join(temporary, 'users', 'legacy-user');
  await fs.outputJson(path.join(legacy, 'profile.json'), { displayName: 'Tên cũ', passwordHash: 'obsolete', preferences: { theme: 'dark' } });
  await fs.outputJson(path.join(legacy, 'notes', 'hoc-tap.json'), [{ id: 'old-note', title: 'Ghi chú cũ', content: 'Còn nguyên' }]);
  assert.equal((await request('/users/profile')).body.user.displayName, 'Tên cũ');
  assert.equal((await request('/notes')).body[0].id, 'old-note');
  assert.equal(await fs.pathExists(path.join(legacy, 'profile.json')), true);
  assert.equal('passwordHash' in (await fs.readJson(path.join(temporary, 'profile.json'))), false);
  await fs.remove(path.join(temporary, 'profile.json'));
  assert.equal((await request('/users/profile')).body.user.displayName, 'Sổ tay cá nhân');
});

// Test the hash used by actual private-password endpoints, not an unused helper.
test('private passwords store bcrypt hashes and Unicode passwords verify without losing accents', async () => {
  const password = 'Mật khẩu tiếng Việt';
  assert.equal((await request('/auth/setup-private-password', 'POST', { privatePassword: password })).status, 200);
  const profile = await fs.readJson(path.join(temporary, 'profile.json'));
  assert.notEqual(profile.privatePasswordHash, password);
  assert.match(profile.privatePasswordHash, /^\$2[aby]\$/);
  assert.equal((await request('/private/auth', 'POST', { password })).status, 200);
  assert.equal((await request('/private/auth', 'POST', { password: 'Mat khau tieng Viet' })).status, 401);
  const response = (await request('/users/profile')).body;
  assert.equal('privatePasswordHash' in response.user, false);
});

test('large private image payloads persist while oversized updates are rejected', async () => {
  const token = await setup();
  const content = 'A'.repeat(1_100_000);
  const result = await request('/private/notes', 'POST', { title: 'encrypted-title', content }, token);
  assert.equal(result.status, 201);
  const id = result.body.note.id;
  assert.equal((await request(`/private/notes/${id}`, 'PUT', { content: 'B'.repeat(8_000_001) }, token)).status, 400);
  assert.equal((await request('/private/notes', 'GET', undefined, token)).body[0].content, content);
});
