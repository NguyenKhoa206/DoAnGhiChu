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

test('collection names retain Vietnamese, capitalization and NFC separately from file slugs', async () => {
  const created = await request('/notes/topics', 'POST', { name: '  Học tập và Ý tưởng  ' });
  assert.equal(created.status, 201);
  assert.equal(created.body.topic.name, 'Học tập và Ý tưởng');
  assert.equal(created.body.topic.slug, 'hoc-tap-va-y-tuong');
  assert.deepEqual((await request('/notes/topics')).body, [{
    id: 'hoc-tap-va-y-tuong', slug: 'hoc-tap-va-y-tuong', name: 'Học tập và Ý tưởng', fileName: 'hoc-tap-va-y-tuong.json',
  }]);
  assert.deepEqual(await fs.readJson(path.join(temporary, 'topics.json')), { 'hoc-tap-va-y-tuong': 'Học tập và Ý tưởng' });
  assert.deepEqual((await request('/notes')).body, []);
});

test('collection display names survive a new backend process', async () => {
  assert.equal((await request('/notes/topics', 'POST', { name: 'Đồ án phần mềm' })).status, 201);
  const child = spawnSync(process.execPath, ['-e', `
    (async () => {
      const app = require('./server');
      const server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/notes/topics');
      if (!response.ok) throw new Error('Could not load collections after restart');
      process.stdout.write('TOPICS_JSON:' + JSON.stringify(await response.json()));
      await new Promise(resolve => server.close(resolve));
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: path.join(__dirname, '..'), env: process.env, encoding: 'utf8', timeout: 10000 });
  assert.equal(child.status, 0, child.stderr);
  const topics = JSON.parse(child.stdout.split('TOPICS_JSON:')[1]);
  assert.equal(topics[0].name, 'Đồ án phần mềm');
});

test('adding diacritics to an existing collection name keeps its notes and filename', async () => {
  await request('/notes/topics', 'POST', { name: 'Hoc tap' });
  const saved = (await request('/notes/hoc-tap', 'POST', { title: 'Bài học', content: '<p>Giữ đủ dấu</p>' })).body.note;
  const changed = await request('/notes/topics/hoc-tap', 'PUT', { name: 'Học tập' });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.topic.slug, 'hoc-tap');
  assert.equal((await request('/notes/topics')).body[0].name, 'Học tập');
  assert.deepEqual((await request('/notes/hoc-tap')).body, [{ ...saved, topicSlug: 'hoc-tap' }]);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['hoc-tap.json']);
});

test('renaming a collection moves active notes and trash references while preserving Vietnamese names', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  const active = (await request('/notes/hoc-tap', 'POST', { title: 'Ghi chú đang dùng' })).body.note;
  const deleted = (await request('/notes/hoc-tap', 'POST', { title: 'Ghi chú đã xóa' })).body.note;
  await request(`/notes/hoc-tap/${deleted.id}`, 'DELETE');
  assert.equal((await request('/notes/trash')).body[0].originalTopicName, 'Học tập');
  const changed = await request('/notes/topics/hoc-tap', 'PUT', { name: 'Đồ án tốt nghiệp' });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.topic.slug, 'do-an-tot-nghiep');
  assert.deepEqual((await request('/notes/hoc-tap')).body, []);
  assert.equal((await request('/notes/do-an-tot-nghiep')).body[0].id, active.id);
  const trashNote = (await request('/notes/trash')).body[0];
  assert.equal(trashNote.originalTopicSlug, 'do-an-tot-nghiep');
  assert.equal(trashNote.originalTopicName, 'Đồ án tốt nghiệp');
  assert.equal((await request(`/notes/trash/${deleted.id}/restore`, 'POST')).body.topicSlug, 'do-an-tot-nghiep');
  assert.equal((await request('/notes/do-an-tot-nghiep')).body.length, 2);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['do-an-tot-nghiep.json']);
  assert.deepEqual(await fs.readJson(path.join(temporary, 'topics.json')), { 'do-an-tot-nghiep': 'Đồ án tốt nghiệp' });
});

test('legacy collections remain accessible without a display-name file and can be repaired by renaming', async () => {
  await fs.outputJson(path.join(temporary, 'notes', 'cong-viec.json'), [{ id: 'legacy-note', title: 'Ghi chú cũ' }]);
  for (const empty of [null, '', '   ', '{}']) {
    const namesPath = path.join(temporary, 'topics.json');
    if (empty === null) await fs.remove(namesPath);
    else await fs.outputFile(namesPath, empty);
    const topics = await request('/notes/topics');
    assert.equal(topics.status, 200);
    assert.equal(topics.body[0].slug, 'cong-viec');
    assert.equal((await request('/notes/cong-viec')).body[0].id, 'legacy-note');
  }
  assert.equal((await request('/notes/topics/cong-viec', 'PUT', { name: 'Công việc' })).status, 200);
  assert.equal((await request('/notes/topics')).body[0].name, 'Công việc');
  assert.equal((await request('/notes/cong-viec')).body[0].id, 'legacy-note');
});

test('legacy Hoc and Y Tuong labels display accents without renaming files or changing notes', async () => {
  const oldNotes = [{ id: 'old-hoc', title: 'Bài học cũ', content: '<p>Nội dung cần giữ</p>' }];
  const ideaNotes = [{ id: 'old-idea', title: 'Ý tưởng cũ' }];
  await fs.outputJson(path.join(temporary, 'notes', 'hoc.json'), oldNotes);
  await fs.outputJson(path.join(temporary, 'notes', 'y-tuong.json'), ideaNotes);
  for (const names of [null, '', '{}']) {
    const namesPath = path.join(temporary, 'topics.json');
    if (names === null) await fs.remove(namesPath);
    else await fs.outputFile(namesPath, names);
    const topics = (await request('/notes/topics')).body;
    assert.equal(topics.find(topic => topic.slug === 'hoc').name, 'Học');
    assert.equal(topics.find(topic => topic.slug === 'y-tuong').name, 'Ý tưởng');
    assert.deepEqual(await fs.readJson(path.join(temporary, 'notes', 'hoc.json')), oldNotes);
    assert.deepEqual(await fs.readJson(path.join(temporary, 'notes', 'y-tuong.json')), ideaNotes);
  }
  assert.equal((await request(`/notes/hoc/${oldNotes[0].id}`, 'DELETE')).status, 200);
  assert.equal((await request('/notes/trash')).body[0].originalTopicName, 'Học');
  assert.equal((await request(`/notes/trash/${oldNotes[0].id}/restore`, 'POST')).body.topicSlug, 'hoc');
  assert.equal((await request('/notes/topics')).body.find(topic => topic.slug === 'hoc').name, 'Học');
});

test('explicit saved names take priority over legacy labels, including names without diacritics', async () => {
  await fs.outputJson(path.join(temporary, 'notes', 'hoc.json'), []);
  await fs.outputJson(path.join(temporary, 'notes', 'y-tuong.json'), []);
  await fs.outputJson(path.join(temporary, 'topics.json'), { hoc: 'HOC', 'y-tuong': 'Ý tưởng sáng tạo' });
  const topics = (await request('/notes/topics')).body;
  assert.equal(topics.find(topic => topic.slug === 'hoc').name, 'HOC');
  assert.equal(topics.find(topic => topic.slug === 'y-tuong').name, 'Ý tưởng sáng tạo');
  assert.equal((await request('/notes/topics/hoc', 'PUT', { name: 'Học' })).status, 200);
  assert.equal((await request('/notes/topics')).body.find(topic => topic.slug === 'hoc').name, 'Học');
});

test('concurrent collection creation and renaming retain every persisted display name', async () => {
  const created = await Promise.all(['Học tập', 'Công việc', 'Ý tưởng'].map(name => request('/notes/topics', 'POST', { name })));
  assert(created.every(result => result.status === 201));
  const renamed = await Promise.all([
    request('/notes/topics/hoc-tap', 'PUT', { name: 'Học tập nâng cao' }),
    request('/notes/topics/cong-viec', 'PUT', { name: 'CÔNG VIỆC' }),
  ]);
  assert(renamed.every(result => result.status === 200));
  assert.deepEqual(await fs.readJson(path.join(temporary, 'topics.json')), {
    'hoc-tap-nang-cao': 'Học tập nâng cao', 'cong-viec': 'CÔNG VIỆC', 'y-tuong': 'Ý tưởng',
  });
  assert.equal((await request('/notes/topics')).body.length, 3);
});

test('invalid collection names cannot create files or overwrite persisted names', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  const namesPath = path.join(temporary, 'topics.json');
  const beforeNames = await fs.readFile(namesPath, 'utf8');
  for (const name of ['', ' \t\n\u00a0 ', {}, [], 12, null, 'A'.repeat(81), '--', 'Ghi chú', 'Nhật ký']) {
    assert.equal((await request('/notes/topics', 'POST', { name })).status, 400);
    assert.equal((await request('/notes/topics/hoc-tap', 'PUT', { name })).status, 400);
  }
  assert.equal(await fs.readFile(namesPath, 'utf8'), beforeNames);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['hoc-tap.json']);
});

test('collection slug collisions do not overwrite either collection or its accented name', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  await request('/notes/topics', 'POST', { name: 'Công việc' });
  assert.equal((await request('/notes/topics', 'POST', { name: 'Hoc tap' })).status, 400);
  assert.equal((await request('/notes/topics/cong-viec', 'PUT', { name: 'Học tập' })).status, 409);
  assert.deepEqual(await fs.readJson(path.join(temporary, 'topics.json')), { 'hoc-tap': 'Học tập', 'cong-viec': 'Công việc' });
  assert.equal((await request('/notes/topics')).body.length, 2);
});

test('restoring a deleted collection retains its display name from trash', async () => {
  await request('/notes/topics', 'POST', { name: 'Ý tưởng sáng tạo' });
  const saved = (await request('/notes/y-tuong-sang-tao', 'POST', { title: 'Ghi chú cần khôi phục' })).body.note;
  assert.equal((await request('/notes/topics/y-tuong-sang-tao', 'DELETE')).status, 200);
  assert.deepEqual((await request('/notes/topics')).body, []);
  await fs.remove(path.join(temporary, 'topics.json'));
  assert.equal((await request('/notes/trash')).body[0].originalTopicName, 'Ý tưởng sáng tạo');
  assert.equal((await request(`/notes/trash/${saved.id}/restore`, 'POST')).status, 200);
  assert.equal((await request('/notes/topics')).body[0].name, 'Ý tưởng sáng tạo');
  assert.equal((await request('/notes/y-tuong-sang-tao')).body[0].id, saved.id);
});

test('malformed display-name storage is reported without overwriting it or moving collection files', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  const namesPath = path.join(temporary, 'topics.json');
  for (const invalid of ['{invalid', '[]', '42']) {
    await fs.writeFile(namesPath, invalid);
    assert.equal((await request('/notes/topics', 'POST', { name: 'Công việc' })).status, 500);
    assert.equal((await request('/notes/topics/hoc-tap', 'PUT', { name: 'Ý tưởng' })).status, 500);
    assert.equal(await fs.readFile(namesPath, 'utf8'), invalid);
    assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['hoc-tap.json']);
  }
});

test('failed display-name writes do not leave empty collections or move existing notes', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  const saved = (await request('/notes/hoc-tap', 'POST', { title: 'Giữ nguyên ghi chú' })).body.note;
  const namesPath = path.join(temporary, 'topics.json');
  const originalNames = await fs.readFile(namesPath, 'utf8');
  const originalRename = fs.rename;
  fs.rename = async (source, destination, ...args) => {
    if (destination === namesPath) throw Object.assign(new Error('Simulated display-name write failure'), { code: 'EIO' });
    return originalRename(source, destination, ...args);
  };
  try {
    assert.equal((await request('/notes/topics', 'POST', { name: 'Công việc' })).status, 500);
    assert.equal((await request('/notes/topics/hoc-tap', 'PUT', { name: 'Ý tưởng' })).status, 500);
  } finally {
    fs.rename = originalRename;
  }
  assert.equal(await fs.readFile(namesPath, 'utf8'), originalNames);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['hoc-tap.json']);
  assert.deepEqual((await request('/notes/hoc-tap')).body, [{ ...saved, topicSlug: 'hoc-tap' }]);
});

test('failed trash writes during renaming roll back both the collection filename and display name', async () => {
  await request('/notes/topics', 'POST', { name: 'Học tập' });
  const saved = (await request('/notes/hoc-tap', 'POST', { title: 'Ghi chú trong thùng rác' })).body.note;
  await request(`/notes/hoc-tap/${saved.id}`, 'DELETE');
  const namesPath = path.join(temporary, 'topics.json');
  const trashPath = path.join(temporary, 'trash.json');
  const originalNames = await fs.readFile(namesPath, 'utf8');
  const originalTrash = await fs.readFile(trashPath, 'utf8');
  const originalRename = fs.rename;
  fs.rename = async (source, destination, ...args) => {
    if (destination === trashPath) throw Object.assign(new Error('Simulated trash write failure'), { code: 'EIO' });
    return originalRename(source, destination, ...args);
  };
  try {
    assert.equal((await request('/notes/topics/hoc-tap', 'PUT', { name: 'Đồ án' })).status, 500);
  } finally {
    fs.rename = originalRename;
  }
  assert.equal(await fs.readFile(namesPath, 'utf8'), originalNames);
  assert.equal(await fs.readFile(trashPath, 'utf8'), originalTrash);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['hoc-tap.json']);
  assert.equal((await request('/notes/topics')).body[0].name, 'Học tập');
  assert.equal((await request(`/notes/trash/${saved.id}/restore`, 'POST')).body.topicSlug, 'hoc-tap');
});

test('creating an unclassified note never creates a collection and trash restore keeps it unclassified', async () => {
  const saved = await request('/notes', 'POST', { title: 'Ghi chú độc lập', content: '<p>Không tạo thư mục</p>' });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.topicSlug, '');
  assert.deepEqual((await request('/notes/topics')).body, []);
  assert.deepEqual(await fs.readdir(path.join(temporary, 'notes')), ['_unfiled.json']);
  const id = saved.body.id;
  assert.equal((await request(`/notes/${id}`, 'PUT', { title: 'Đã sửa' })).status, 200);
  assert.equal((await request(`/notes/${id}`, 'DELETE')).status, 200);
  assert.equal((await request(`/notes/trash/${id}/restore`, 'POST')).body.topicSlug, '');
  assert.deepEqual((await request('/notes/topics')).body, []);
  assert.equal((await request('/notes')).body[0].title, 'Đã sửa');
});

test('former automatic Ghi chu and Nhat ky collections migrate without losing notes or custom collections', async () => {
  const former = [{ id: 'default-note', title: 'Ghi chú cũ', isPinned: true }];
  const journal = [{ id: 'journal-note', title: 'Nhật ký cũ', content: '<p>Giữ nội dung</p>' }];
  await fs.outputJson(path.join(temporary, 'notes', 'ghi-chu.json'), former);
  await fs.outputJson(path.join(temporary, 'notes', 'nhat-ky.json'), journal);
  await fs.outputJson(path.join(temporary, 'notes', 'hoc-tap.json'), []);
  assert.deepEqual((await request('/notes/topics')).body.map((topic) => topic.slug), ['hoc-tap']);
  for (let i = 0; i < 2; i++) {
    const notes = (await request('/notes')).body;
    assert.equal(notes.length, 2);
    assert.equal(notes.find((note) => note.id === 'journal-note').content, '<p>Giữ nội dung</p>');
    assert.equal(notes.find((note) => note.id === 'default-note').isPinned, true);
    assert(notes.every((note) => note.topicSlug === ''));
  }
  assert.deepEqual((await fs.readdir(path.join(temporary, 'notes'))).sort(), ['_unfiled.json', 'hoc-tap.json']);
  // Legacy note endpoints remain compatible without reintroducing a folder.
  assert.equal((await request('/notes/ghi-chu', 'POST', { title: 'Client cũ' })).status, 201);
  assert.deepEqual((await request('/notes/topics')).body.map((topic) => topic.slug), ['hoc-tap']);
});

test('invalid dates, missing timezone, invalid types and past schedules cannot change saved notes', async () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const saved = (await request('/notes', 'POST', { title: 'Lịch đúng', reminderAt: future })).body;
  for (const reminderAt of ['bad', '2026-02-30T12:00:00Z', '2026-10-10T25:00:00Z', '2030-10-10T10:00', {}, new Date(Date.now() - 1000).toISOString()]) {
    assert.equal((await request('/notes', 'POST', { title: 'Lịch sai', reminderAt })).status, 400);
    assert.equal((await request(`/notes/${saved.id}`, 'PUT', { reminderAt })).status, 400);
  }
  const notes = (await request('/notes')).body;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].reminderAt, future);
});

test('schedules normalize timezone, survive partial edits and can be removed', async () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const offsetTime = future.replace('Z', '+00:00');
  const saved = (await request('/notes', 'POST', { title: 'Nộp bài', reminderAt: offsetTime })).body;
  assert.equal(saved.reminderAt, future);
  const updated = (await request(`/notes/${saved.id}`, 'PUT', { isPinned: true })).body;
  assert.equal(updated.reminderAt, future);
  assert.equal((await request('/notes/reminders')).body[0].id, saved.id);
  assert.equal((await request(`/notes/reminders/${saved.id}/deliver`, 'POST', { reminderAt: future })).body.delivered, false);
  assert.equal((await request(`/notes/${saved.id}`, 'PUT', { reminderAt: null })).body.reminderAt, null);
  assert.deepEqual((await request('/notes/reminders')).body, []);
});

test('due reminders are delivered once across concurrent tabs; repeat reads and text edits cannot rearm them', async () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const saved = (await request('/notes', 'POST', { title: 'Việc đến hạn', reminderAt: future })).body;
  const target = path.join(temporary, 'notes', '_unfiled.json');
  const due = new Date(Date.now() - 60_000).toISOString();
  await fs.writeJson(target, [{ ...saved, reminderAt: due }]);
  const results = await Promise.all([request(`/notes/reminders/${saved.id}/deliver`, 'POST', { reminderAt: due }), request(`/notes/reminders/${saved.id}/deliver`, 'POST', { reminderAt: due })]);
  assert.deepEqual(results.map((result) => result.body.delivered).sort(), [false, true]);
  assert((await request('/notes/reminders')).body[0].reminderNotifiedAt);
  const edited = (await request(`/notes/${saved.id}`, 'PUT', { title: 'Sửa sau khi nhắc', reminderAt: due, reminderNotifiedAt: null })).body;
  assert(edited.reminderNotifiedAt);
  assert.equal((await request(`/notes/reminders/${saved.id}/deliver`, 'POST', { reminderAt: due })).body.delivered, false);
  const rescheduled = (await request(`/notes/${saved.id}`, 'PUT', { reminderAt: future })).body;
  assert.equal(rescheduled.reminderNotifiedAt, null);
  assert.equal((await request(`/notes/reminders/${saved.id}/deliver`, 'POST', { reminderAt: due })).body.delivered, false);
});

test('deleting a scheduled note cancels its reminder and restoring preserves the saved schedule', async () => {
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const note = (await request('/notes', 'POST', { title: 'Có lịch', reminderAt: future })).body;
  await request(`/notes/${note.id}`, 'DELETE');
  assert.deepEqual((await request('/notes/reminders')).body, []);
  assert.equal((await request(`/notes/reminders/${note.id}/deliver`, 'POST', { reminderAt: future })).status, 404);
  const restored = (await request(`/notes/trash/${note.id}/restore`, 'POST')).body;
  assert.equal(restored.reminderAt, future);
  assert.equal((await request('/notes/reminders')).body.length, 1);
});

test('private reminder summaries and delivery never expose note titles, content or metadata', async () => {
  const token = await setup();
  const future = new Date(Date.now() + 3_600_000).toISOString();
  const result = await request('/private/notes', 'POST', { title: 'encrypted-title', content: 'encrypted-content', metadata: 'encrypted-metadata', reminderAt: future }, token);
  assert.equal(result.status, 201);
  const note = result.body.note;
  const summary = (await request('/notes/reminders')).body[0];
  assert.equal(summary.isPrivate, true);
  assert.equal(summary.title, 'Một ghi chú riêng tư cần xem lại');
  assert.equal(JSON.stringify(summary).includes('encrypted'), false);
  const due = new Date(Date.now() - 1000).toISOString();
  await fs.writeJson(path.join(temporary, 'private.json'), [{ ...note, reminderAt: due }]);
  const delivered = await request(`/notes/reminders/${note.id}/deliver`, 'POST', { reminderAt: due });
  assert.equal(delivered.body.delivered, true);
  assert.equal(JSON.stringify(delivered.body).includes('encrypted'), false);
  assert.equal((await request(`/private/notes/${note.id}`, 'PUT', { reminderAt: 'invalid' }, token)).status, 400);
  assert.equal((await request('/private/notes', 'POST', { title: 'e', content: 'e', reminderAt: due }, token)).status, 400);
});

test('concurrent note writes do not drop either note', async () => {
  const results = await Promise.all([request('/notes', 'POST', { title: 'Thứ nhất' }), request('/notes', 'POST', { title: 'Thứ hai' })]);
  assert(results.every((result) => result.status === 201));
  assert.deepEqual((await request('/notes')).body.map((note) => note.title).sort(), ['Thứ hai', 'Thứ nhất']);
});

test('private password rotation and reminder delivery preserve both new ciphertext and delivered status', async () => {
  const token = await setup();
  const note = (await request('/private/notes', 'POST', { title: 'old-cipher', content: 'old-content', reminderAt: new Date(Date.now() + 3_600_000).toISOString() }, token)).body.note;
  const due = new Date(Date.now() - 1000).toISOString();
  await fs.writeJson(path.join(temporary, 'private.json'), [{ ...note, reminderAt: due }]);
  const [changed, delivered] = await Promise.all([
    request('/auth/change-private-password', 'PUT', { currentPassword: 'old-secret', newPassword: 'new-secret', encryptedNotes: [{ id: note.id, title: 'new-cipher', content: 'new-content' }] }),
    request(`/notes/reminders/${note.id}/deliver`, 'POST', { reminderAt: due }),
  ]);
  assert.equal(changed.status, 200);
  assert.equal(delivered.body.delivered, true);
  assert.equal((await request('/private/notes', 'GET', undefined, token)).status, 403);
  const access = (await request('/auth/verify-private-password', 'POST', { privatePassword: 'new-secret' })).body.privateToken;
  const saved = (await request('/private/notes', 'GET', undefined, access)).body[0];
  assert.equal(saved.title, 'new-cipher');
  assert.equal(saved.content, 'new-content');
  assert(saved.reminderNotifiedAt);
  assert.equal(saved.reminderAt, due);
});

test('reminder delivery rejects requests without a schedule instead of returning a server error', async () => {
  assert.equal((await request('/notes/reminders/missing/deliver', 'POST')).status, 400);
  assert.equal((await request('/notes/reminders/missing/deliver', 'POST', {})).status, 400);
});

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
