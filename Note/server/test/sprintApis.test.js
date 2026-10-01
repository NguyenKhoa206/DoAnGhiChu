const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('fs-extra');
const jwt = require('jsonwebtoken');
const app = require('../server');
const JWT_SECRET = require('../config/jwt');
const { getAccountDir } = require('../utils/accountStorage');

const withApi = async (callback) => {
  const accounts = ['a', 'b'].map((name) => {
    const id = `test-sprint-${name}-${randomUUID()}`;
    return { id, token: jwt.sign({ userId: id, scope: 'account' }, JWT_SECRET, { expiresIn: '1h' }) };
  });
  let server;
  try {
    for (const account of accounts) {
      await fs.outputJson(path.join(getAccountDir(account.id), 'profile.json'), {
        id: account.id, username: account.id, privatePasswordHash: null,
      });
    }
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const request = async (account, url, method = 'GET', body, privateToken) => {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${account.token}`,
          'Content-Type': 'application/json',
          ...(privateToken ? { 'X-Private-Token': privateToken } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    };
    await callback(request, ...accounts);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await Promise.all(accounts.map((account) => fs.remove(getAccountDir(account.id))));
  }
};

test('Sprint 2 topic APIs persist CRUD, keep topics/accounts separate and support untitled notes', async () => {
  await withApi(async (request, owner, other) => {
    assert.deepEqual((await request(owner, '/notes/hoc-tap')).body, []);
    assert.deepEqual(await fs.readdir(getAccountDir(owner.id)), ['profile.json']);
    const created = await request(owner, '/notes/hoc-tap', 'POST', { title: '  ', content: '<p>Nội dung</p>' });
    assert.equal(created.status, 201);
    assert.equal(created.body.success, true);
    const note = created.body.note;
    assert.equal(note.title, 'Không tiêu đề');
    assert.equal(note.topicSlug, 'hoc-tap');
    assert.equal(typeof note.id, 'string');
    assert.ok(note.createdAt && note.updatedAt);
    assert.deepEqual((await request(owner, '/notes/cong-viec')).body, []);
    assert.deepEqual((await request(other, '/notes/hoc-tap')).body, []);
    assert.equal((await request(owner, `/notes/cong-viec/${note.id}`, 'PUT', { title: 'Wrong topic' })).status, 404);
    assert.equal((await request(owner, `/notes/cong-viec/${note.id}`, 'DELETE')).status, 404);
    assert.equal((await request(other, `/notes/hoc-tap/${note.id}`, 'DELETE')).status, 404);

    const updated = await request(owner, `/notes/hoc-tap/${note.id}`, 'PUT', { title: 'Đã sửa', content: 'Mới' });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.note.title, 'Đã sửa');
    assert.equal(updated.body.note.createdAt, note.createdAt);
    assert.equal((await request(owner, '/notes/hoc-tap')).body[0].content, 'Mới');
    assert.equal((await request(owner, '/notes?topic=hoc-tap')).body[0].title, 'Đã sửa');
    const saved = await fs.readJson(path.join(getAccountDir(owner.id), 'notes', 'hoc-tap.json'));
    assert.equal(saved[0].title, 'Đã sửa');

    assert.equal((await request(owner, `/notes/hoc-tap/${note.id}`, 'DELETE')).status, 200);
    assert.deepEqual((await request(owner, '/notes/hoc-tap')).body, []);
    assert.deepEqual(await fs.readJson(path.join(getAccountDir(owner.id), 'notes', 'hoc-tap.json')), []);
    assert.equal((await request(owner, '/notes/trash')).body[0].id, note.id);
    assert.equal((await request(owner, `/notes/trash/${note.id}/restore`, 'POST')).status, 200);
    assert.equal((await request(owner, '/notes/hoc-tap')).body[0].id, note.id);
    assert.equal((await request(owner, '/notes/bad%20topic', 'POST', { title: 'Bad topic' })).status, 400);
    assert.equal((await request(owner, '/notes/hoc-tap', 'POST', { title: {} })).status, 400);
  });
});

test('every private API requires the owner private grant, including legacy URLs and trash', async () => {
  await withApi(async (request, owner, other) => {
    for (const prefix of ['/private/notes', '/notes/private']) {
      for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
        const url = ['PUT', 'DELETE'].includes(method) ? `${prefix}/missing` : prefix;
        const response = await request(owner, url, method, method === 'GET' ? undefined : {});
        assert.equal(response.status, 403, `${method} ${url}`);
        assert.equal(response.body.code, 'PRIVATE_LOCKED');
      }
    }
    for (const prefix of ['/private/trash', '/notes/private/trash']) {
      assert.equal((await request(owner, prefix)).status, 403);
      assert.equal((await request(owner, `${prefix}/missing/restore`, 'POST')).status, 403);
      assert.equal((await request(owner, `${prefix}/missing`, 'DELETE')).status, 403);
    }

    const setup = await request(owner, '/auth/setup-private-password', 'POST', { privatePassword: 'old-secret' });
    assert.equal(setup.status, 200);
    assert.deepEqual(await fs.readJson(path.join(getAccountDir(owner.id), 'private.json')), []);
    await request(other, '/auth/setup-private-password', 'POST', { privatePassword: 'old-secret' });
    assert.equal((await request(owner, '/auth/setup-private-password', 'POST', { privatePassword: 'bypass-secret' })).status, 409);
    const wrong = await request(owner, '/private/auth', 'POST', { password: 'wrong-secret' });
    assert.equal(wrong.status, 401);
    assert.equal(wrong.body.success, false);
    assert.equal(wrong.body.code, 'PRIVATE_PASSWORD_INVALID');
    assert.equal((await request(owner, '/auth/private-status')).status, 200);

    const grant = (await request(owner, '/private/auth', 'POST', { password: 'old-secret' })).body.privateToken;
    assert.equal((await request(other, '/private/notes', 'GET', undefined, grant)).status, 403);
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, owner.token)).status, 403);
    assert.equal((await request({ token: grant }, '/users/profile')).status, 401);
    const { iat, exp, ...payload } = jwt.decode(grant);
    assert.ok(iat && exp);
    const expiredGrant = jwt.sign(payload, JWT_SECRET, { expiresIn: -1 });
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, expiredGrant)).status, 403);

    const created = await request(owner, '/private/notes', 'POST', { title: 'encrypted-title', content: 'encrypted-body' }, grant);
    assert.equal(created.status, 201);
    const id = created.body.note.id;
    assert.equal((await request(owner, '/notes/private', 'GET', undefined, grant)).body[0].id, id);
    const updated = await request(owner, `/private/notes/${id}`, 'PUT', { content: 'changed-ciphertext' }, grant);
    assert.equal(updated.body.note.content, 'changed-ciphertext');
    assert.equal((await request(owner, `/private/notes/${id}`, 'DELETE', undefined, grant)).status, 200);
    assert.deepEqual((await request(owner, '/private/notes', 'GET', undefined, grant)).body, []);
    assert.equal((await request(owner, '/private/trash', 'GET', undefined, grant)).body[0].id, id);
    assert.deepEqual((await request(owner, '/notes/trash')).body, []);
    assert.equal((await request(owner, `/private/trash/${id}/restore`, 'POST', {}, grant)).status, 200);
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, grant)).body[0].id, id);
  });
});

test('changing a private password invalidates old grants and preserves active notes plus private trash', async () => {
  await withApi(async (request, owner) => {
    const grant = (await request(owner, '/auth/setup-private-password', 'POST', { privatePassword: 'old-secret' })).body.privateToken;
    const active = (await request(owner, '/private/notes', 'POST', { title: 'old-active', content: 'old-body' }, grant)).body.note;
    const trash = (await request(owner, '/private/notes', 'POST', { title: 'old-trash', content: 'old-body' }, grant)).body.note;
    await request(owner, `/private/notes/${trash.id}`, 'DELETE', undefined, grant);
    const changed = await request(owner, '/auth/change-private-password', 'PUT', {
      currentPassword: 'old-secret', newPassword: 'new-secret',
      encryptedNotes: [{ id: active.id, title: 'new-active', content: 'new-body' }],
      encryptedPrivateTrashNotes: [{ id: trash.id, title: 'new-trash', content: 'new-body' }],
    });
    assert.equal(changed.status, 200);
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, grant)).status, 403);
    assert.equal((await request(owner, '/notes/private/trash', 'GET', undefined, grant)).status, 403);
    assert.equal((await request(owner, '/private/auth', 'POST', { password: 'old-secret' })).status, 401);
    const unlocked = await request(owner, '/private/auth', 'POST', { password: 'new-secret' });
    assert.equal(unlocked.status, 200);
    const newGrant = unlocked.body.privateToken;
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, newGrant)).body[0].title, 'new-active');
    assert.equal((await request(owner, '/private/trash', 'GET', undefined, newGrant)).body[0].title, 'new-trash');
    assert.equal((await request(owner, '/users/profile')).status, 200);
  });
});

test('private image content larger than the old text limit persists, updates and rotates passwords', async () => {
  await withApi(async (request, owner) => {
    const grant = (await request(owner, '/auth/setup-private-password', 'POST', { privatePassword: 'old-secret' })).body.privateToken;
    const content = 'A'.repeat(1_100_000);
    const created = await request(owner, '/private/notes', 'POST', { title: 'encrypted-title', content }, grant);
    assert.equal(created.status, 201);
    const id = created.body.note.id;
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, grant)).body[0].content, content);
    const updatedContent = 'B'.repeat(1_200_000);
    assert.equal((await request(owner, `/private/notes/${id}`, 'PUT', { content: updatedContent }, grant)).status, 200);
    assert.equal((await request(owner, `/private/notes/${id}`, 'PUT', { content: 'C'.repeat(8_000_001) }, grant)).status, 400);
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, grant)).body[0].content, updatedContent);
    const changed = await request(owner, '/auth/change-private-password', 'PUT', { currentPassword: 'old-secret', newPassword: 'new-secret', encryptedNotes: [{ id, title: 'new-title', content }], encryptedPrivateTrashNotes: [] });
    assert.equal(changed.status, 200);
    const newGrant = (await request(owner, '/private/auth', 'POST', { password: 'new-secret' })).body.privateToken;
    assert.equal((await request(owner, '/private/notes', 'GET', undefined, newGrant)).body[0].content, content);
  });
});

test('saved notes retain formatting, crop settings and file chips, and removing a file clears its data', async () => {
  await withApi(async (request, owner) => {
    const id = 'file_regression123';
    const attachments = [{ id, name: 'Tài liệu.txt', type: 'text/plain', dataUrl: `data:text/plain;base64,${Buffer.alloc(800 * 1024).toString('base64')}` }];
    const content = `<h1 style="text-align:center">Tiêu đề</h1><p style="line-height:1.6;color:rgb(36, 99, 235)"><span class="note-file-chip" contenteditable="false"><a class="note-file-link" href="#note-file-${id}">Tài liệu.txt</a><button type="button" class="note-file-remove" data-file-id="${id}">×</button></span></p>`;
    const created = await request(owner, '/notes/ghi-chu', 'POST', { title: 'Ảnh và tệp', content, attachments });
    assert.equal(created.status, 201);
    const noteId = created.body.note.id;
    const saved = (await request(owner, '/notes/ghi-chu')).body[0];
    assert.match(saved.content, /note-file-remove/);
    assert.match(saved.content, /text-align:center/);
    assert.match(saved.content, /line-height:1.6/);
    assert.equal(saved.attachments[0].dataUrl, attachments[0].dataUrl);
    const removed = await request(owner, `/notes/ghi-chu/${noteId}`, 'PUT', { content: '<p>Đã gỡ tệp</p>', attachments: [] });
    assert.equal(removed.status, 200);
    const result = (await request(owner, '/notes/ghi-chu')).body[0];
    assert.deepEqual(result.attachments, []);
    assert.doesNotMatch(result.content, /note-file|data:text/);
  });
});
