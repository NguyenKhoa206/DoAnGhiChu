const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const noteController = require('../controllers/noteController');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const usersDir = path.resolve(__dirname, '../data/users');

const responseStub = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

const withUsers = async (ids, callback) => {
  const dirs = ids.map((id) => path.join(usersDir, id));
  try {
    await callback(dirs);
  } finally {
    await Promise.all(dirs.map((dir) => fs.remove(dir)));
  }
};

test('registration and login give a regular account a persistent notebook session', async () => {
  const username = `fresh_${randomUUID().slice(0, 12)}`;
  let userDir;
  try {
    const response = responseStub();
    await authController.register({ body: { username, displayName: 'Fresh test', email: '', password: 'Safe-test-password' } }, response);
    assert.equal(response.statusCode, 201);
    assert.ok(response.body.token);

    for (const folder of await fs.readdir(usersDir)) {
      const candidate = path.join(usersDir, folder);
      const profilePath = path.join(candidate, 'profile.json');
      if (await fs.pathExists(profilePath) && (await fs.readJson(profilePath)).username === username) {
        userDir = candidate;
        break;
      }
    }
    assert.ok(userDir);
    assert.deepEqual(await fs.readdir(userDir), ['profile.json']);

    const loginResponse = responseStub();
    await authController.login({ body: { username, password: 'Safe-test-password' } }, loginResponse);
    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.body.user.role, 'user');
    const tokenPayload = jwt.decode(loginResponse.body.token);
    assert.equal(tokenPayload.exp - tokenPayload.iat, 365 * 24 * 60 * 60);

    const request = { headers: { authorization: `Bearer ${loginResponse.body.token}` } };
    let authenticated = false;
    await authMiddleware(request, responseStub(), () => { authenticated = true; });
    assert.equal(authenticated, true);
    assert.equal(request.user.role, 'user');
  } finally {
    if (userDir) await fs.remove(userDir);
  }
});

test('deleting a topic removes its notes only from the authenticated user', async () => {
  const userA = `test-delete-topic-a-${randomUUID()}`;
  const userB = `test-delete-topic-b-${randomUUID()}`;
  await withUsers([userA, userB], async ([dirA, dirB]) => {
    const notesA = path.join(dirA, 'notes');
    const notesB = path.join(dirB, 'notes');
    await fs.ensureDir(notesA);
    await fs.ensureDir(notesB);
    await fs.writeJson(path.join(notesA, 'study.json'), [{ id: 'note-a', title: 'A' }]);
    await fs.writeJson(path.join(notesB, 'study.json'), [{ id: 'note-b', title: 'B' }]);

    const res = responseStub();
    await noteController.deleteTopic({ user: { userId: userA }, params: { topicId: 'study' } }, res);

    assert.equal(res.statusCode, 200);
    assert.equal(await fs.pathExists(path.join(notesA, 'study.json')), false);
    assert.equal(await fs.pathExists(path.join(notesB, 'study.json')), true);
  });
});

test('deleting a note returns 404 when the user has no notes directory', async () => {
  const userId = `test-delete-missing-notes-${randomUUID()}`;
  await withUsers([userId], async () => {
    const res = responseStub();
    await noteController.deleteNote({ user: { userId }, params: { noteId: 'missing' } }, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /không tìm thấy ghi chú/i);
  });
});

test('new notes from system collections use a neutral topic and persist pin/favorite state', async () => {
  const userId = `test-system-note-flags-${randomUUID()}`;
  await withUsers([userId], async ([userDir]) => {
    const created = responseStub();
    await noteController.createNote({
      user: { userId },
      body: { title: 'Saved from favorites', content: '<p>Body</p>', isFavorite: true, isPinned: true },
    }, created);

    assert.equal(created.statusCode, 201);
    assert.equal(created.body.topicSlug, 'ghi-chu');
    assert.equal(created.body.isFavorite, true);
    assert.equal(created.body.isPinned, true);
    assert.equal(await fs.pathExists(path.join(userDir, 'notes', 'hoc-tap.json')), false);

    const updated = responseStub();
    await noteController.updateNote({
      user: { userId },
      params: { noteId: created.body.id },
      body: { isFavorite: false },
    }, updated);
    assert.equal(updated.statusCode, 200);
    assert.equal(updated.body.isFavorite, false);
    assert.equal(updated.body.isPinned, true);

    const listed = responseStub();
    await noteController.getAllNotes({ user: { userId }, query: {} }, listed);
    assert.equal(listed.body[0].isPinned, true);
    assert.equal(listed.body[0].isFavorite, false);
  });
});

test('private note metadata is stored and legacy updates preserve encrypted metadata', async () => {
  const userId = `test-private-metadata-${randomUUID()}`;
  await withUsers([userId], async ([userDir]) => {
    const createRes = responseStub();
    await noteController.createPrivateNote({
      user: { userId },
      body: { title: 'encrypted title', content: 'encrypted body', metadata: 'encrypted metadata' },
    }, createRes);

    assert.equal(createRes.statusCode, 201);
    assert.equal(createRes.body.metadata, 'encrypted metadata');

    const updateRes = responseStub();
    await noteController.updatePrivateNote({
      user: { userId },
      params: { noteId: createRes.body.id },
      body: { title: 'updated title', content: 'updated body' },
    }, updateRes);

    const saved = await fs.readJson(path.join(userDir, 'private.json'));
    assert.equal(updateRes.statusCode, 200);
    assert.equal(saved[0].title, 'updated title');
    assert.equal(saved[0].content, 'updated body');
    assert.equal(saved[0].metadata, 'encrypted metadata');
  });
});

test('deleting a note removes it from the correct topic file and preserves other notes', async () => {
  const userId = `test-delete-note-${randomUUID()}`;
  await withUsers([userId], async ([userDir]) => {
    const notesDir = path.join(userDir, 'notes');
    await fs.ensureDir(notesDir);
    const topicFile = path.join(notesDir, 'study.json');
    await fs.writeJson(topicFile, [{ id: 'remove-me' }, { id: 'keep-me' }]);

    const res = responseStub();
    await noteController.deleteNote({ user: { userId }, params: { noteId: 'remove-me' } }, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(await fs.readJson(topicFile), [{ id: 'keep-me' }]);
    const trash = await fs.readJson(path.join(userDir, 'trash.json'));
    assert.equal(trash[0].id, 'remove-me');
    assert.equal(trash[0].originalTopicSlug, 'study');
    assert.ok(trash[0].deletedAt);
  });
});

test('public and private trash stay separate and restore to their matching stores', async () => {
  const userId = `test-separated-trash-${randomUUID()}`;
  await withUsers([userId], async ([userDir]) => {
    const notesDir = path.join(userDir, 'notes');
    await fs.ensureDir(notesDir);
    await fs.writeJson(path.join(notesDir, 'study.json'), [{ id: 'same-id', title: 'Public note' }]);
    await fs.writeJson(path.join(userDir, 'private.json'), [{ id: 'same-id', title: 'encrypted-private-title', content: 'encrypted-private-body' }]);
    await fs.writeJson(path.join(userDir, 'trash.json'), [{ id: 'public-already-trashed', title: 'Public trash item', originalTopicSlug: 'study' }]);

    const privateDeleteRes = responseStub();
    await noteController.deletePrivateNote({ user: { userId }, params: { noteId: 'same-id' } }, privateDeleteRes);
    assert.equal(privateDeleteRes.statusCode, 200);
    assert.deepEqual(await fs.readJson(path.join(userDir, 'private.json')), []);
    assert.equal((await fs.readJson(path.join(userDir, 'trash.json')))[0].id, 'public-already-trashed');
    assert.equal((await fs.readJson(path.join(userDir, 'private-trash.json')))[0].title, 'encrypted-private-title');

    const privateRestoreRes = responseStub();
    await noteController.restorePrivateTrashNote({ user: { userId }, params: { noteId: 'same-id' } }, privateRestoreRes);
    assert.equal(privateRestoreRes.statusCode, 200);
    assert.equal((await fs.readJson(path.join(userDir, 'private.json')))[0].title, 'encrypted-private-title');
    assert.deepEqual(await fs.readJson(path.join(userDir, 'private-trash.json')), []);

    const publicDeleteRes = responseStub();
    await noteController.deleteNote({ user: { userId }, params: { noteId: 'same-id' } }, publicDeleteRes);
    assert.equal(publicDeleteRes.statusCode, 200);
    assert.equal((await fs.readJson(path.join(userDir, 'trash.json')))[0].id, 'same-id');
    assert.equal((await fs.readJson(path.join(userDir, 'private.json')))[0].id, 'same-id');

    const publicRestoreRes = responseStub();
    await noteController.restoreTrashNote({ user: { userId }, params: { noteId: 'same-id' } }, publicRestoreRes);
    assert.equal(publicRestoreRes.statusCode, 200);
    assert.equal((await fs.readJson(path.join(notesDir, 'study.json')))[0].id, 'same-id');
    assert.equal((await fs.readJson(path.join(userDir, 'private.json')))[0].id, 'same-id');
  });
});

test('changing the private password re-encrypts active notes and private trash separately', async () => {
  const userId = `test-private-password-trash-${randomUUID()}`;
  await withUsers([userId], async ([userDir]) => {
    await fs.ensureDir(userDir);
    await fs.writeJson(path.join(userDir, 'profile.json'), {
      id: userId,
      username: userId,
      privatePasswordHash: await bcrypt.hash('old-secret', 4),
    });
    await fs.writeJson(path.join(userDir, 'private.json'), [{ id: 'active-id', title: 'old-active-title', content: 'old-active-content' }]);
    await fs.writeJson(path.join(userDir, 'private-trash.json'), [{ id: 'trashed-id', title: 'old-trash-title', content: 'old-trash-content', deletedAt: '2026-09-27T00:00:00.000Z' }]);

    const res = responseStub();
    await authController.changePrivatePassword({
      user: { userId },
      body: {
        currentPassword: 'old-secret',
        newPassword: 'new-secret',
        encryptedNotes: [{ id: 'active-id', title: 'new-active-title', content: 'new-active-content' }],
        encryptedPrivateTrashNotes: [{ id: 'trashed-id', title: 'new-trash-title', content: 'new-trash-content' }],
      },
    }, res);

    assert.equal(res.statusCode, 200);
    assert.equal((await fs.readJson(path.join(userDir, 'private.json')))[0].title, 'new-active-title');
    assert.equal((await fs.readJson(path.join(userDir, 'private-trash.json')))[0].title, 'new-trash-title');
    assert.equal((await fs.readJson(path.join(userDir, 'private-trash.json')))[0].deletedAt, '2026-09-27T00:00:00.000Z');
    const savedProfile = await fs.readJson(path.join(userDir, 'profile.json'));
    assert.equal(await bcrypt.compare('new-secret', savedProfile.privatePasswordHash), true);
  });
});

test('profile edits persist per account and are returned without password hashes', async () => {
  const ownerId = `test-profile-owner-${randomUUID()}`;
  const otherId = `test-profile-other-${randomUUID()}`;
  await withUsers([ownerId, otherId], async ([ownerDir, otherDir]) => {
    const originalOwner = {
      id: ownerId, username: 'owner', displayName: 'Tên cũ', email: 'old@example.com',
      passwordHash: 'keep-this-hash', role: 'user', preferences: { theme: 'light', primaryColor: '#b9785a' },
    };
    const originalOther = {
      id: otherId, username: 'other', displayName: 'Người khác', email: 'other@example.com',
      passwordHash: 'other-hash', role: 'user', preferences: { theme: 'dark', primaryColor: '#2196f3' },
    };
    await fs.ensureDir(ownerDir);
    await fs.ensureDir(otherDir);
    await fs.writeJson(path.join(ownerDir, 'profile.json'), originalOwner);
    await fs.writeJson(path.join(otherDir, 'profile.json'), originalOther);

    const res = responseStub();
    await userController.updateProfile({
      user: { userId: ownerId },
      body: {
        displayName: 'Tên mới',
        email: 'new@example.com',
        avatarDataUrl: 'data:image/png;base64,aGVsbG8=',
        preferences: { theme: 'dark', primaryColor: '#2196f3' },
      },
    }, res);

    const savedOwner = await fs.readJson(path.join(ownerDir, 'profile.json'));
    const unchangedOther = await fs.readJson(path.join(otherDir, 'profile.json'));
    assert.equal(res.statusCode, 200);
    assert.equal(savedOwner.displayName, 'Tên mới');
    assert.equal(savedOwner.email, 'new@example.com');
    assert.equal(savedOwner.avatarDataUrl, 'data:image/png;base64,aGVsbG8=');
    assert.deepEqual(savedOwner.preferences, { theme: 'dark', primaryColor: '#2196f3' });
    assert.equal(savedOwner.passwordHash, 'keep-this-hash');
    assert.deepEqual(unchangedOther, originalOther);
    assert.equal(res.body.user.avatarDataUrl, savedOwner.avatarDataUrl);
    assert.equal(Object.hasOwn(res.body.user, 'passwordHash'), false);

    const profileRes = responseStub();
    await userController.getProfile({ user: { userId: ownerId } }, profileRes);
    assert.equal(profileRes.statusCode, 200);
    assert.equal(profileRes.body.user.displayName, 'Tên mới');
    assert.equal(profileRes.body.user.email, 'new@example.com');
    assert.equal(profileRes.body.user.avatarDataUrl, 'data:image/png;base64,aGVsbG8=');
  });
});

test('notebook preferences persist through partial updates, profile edits and login', async () => {
  const ownerId = `test-preferences-${randomUUID()}`;
  const username = `prefs_${randomUUID().slice(0, 12)}`;
  await withUsers([ownerId], async ([ownerDir]) => {
    await fs.ensureDir(ownerDir);
    await fs.writeJson(path.join(ownerDir, 'profile.json'), {
      id: ownerId, username, displayName: 'HKT', email: '',
      passwordHash: await bcrypt.hash('settings-secret', 10),
      preferences: { theme: 'light', primaryColor: '#2463eb' },
    });
    const res = responseStub();
    await userController.updatePreferences({ user: { userId: ownerId }, body: { noteLayout: 'grid', noteSort: 'title', density: 'compact' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.preferences.noteLayout, 'grid');
    const themeResponse = responseStub();
    await userController.updatePreferences({ user: { userId: ownerId }, body: { theme: 'dark' } }, themeResponse);
    assert.deepEqual(themeResponse.body.preferences, { theme: 'dark', primaryColor: '#2463eb', noteLayout: 'grid', noteSort: 'title', density: 'compact' });
    const profileResponse = responseStub();
    await userController.updateProfile({ user: { userId: ownerId }, body: { displayName: 'Tên mới', preferences: { primaryColor: '#ea580c' } } }, profileResponse);
    assert.equal(profileResponse.body.preferences.noteLayout, 'grid');
    assert.equal(profileResponse.body.preferences.density, 'compact');
    const loginResponse = responseStub();
    await authController.login({ body: { username, password: 'settings-secret' } }, loginResponse);
    assert.equal(loginResponse.statusCode, 200);
    assert.deepEqual(loginResponse.body.preferences, { theme: 'dark', primaryColor: '#ea580c', noteLayout: 'grid', noteSort: 'title', density: 'compact' });
  });
});

test('invalid notebook preferences and malformed avatar values cannot overwrite saved settings', async () => {
  const ownerId = `test-preferences-invalid-${randomUUID()}`;
  await withUsers([ownerId], async ([ownerDir]) => {
    await fs.ensureDir(ownerDir);
    const original = { id: ownerId, displayName: 'HKT', preferences: { theme: 'light', primaryColor: '#2463eb', noteLayout: 'grid' } };
    const file = path.join(ownerDir, 'profile.json');
    await fs.writeJson(file, original);
    for (const preferences of [{ noteLayout: 'unknown' }, { noteSort: 'invalid' }, { density: false }, { primaryColor: 'red' }]) {
      for (const action of ['updatePreferences', 'updateProfile']) {
        const response = responseStub();
        await userController[action]({ user: { userId: ownerId }, body: action === 'updatePreferences' ? preferences : { preferences } }, response);
        assert.equal(response.statusCode, 400);
        assert.deepEqual(await fs.readJson(file), original);
      }
    }
    for (const avatarDataUrl of [null, false, 0, {}]) {
      const response = responseStub();
      await userController.updateProfile({ user: { userId: ownerId }, body: { avatarDataUrl } }, response);
      assert.equal(response.statusCode, 400);
      assert.deepEqual(await fs.readJson(file), original);
    }
    const cleared = responseStub();
    await userController.updateProfile({ user: { userId: ownerId }, body: { avatarDataUrl: '' } }, cleared);
    assert.equal(cleared.statusCode, 200);
    assert.equal((await fs.readJson(file)).avatarDataUrl, '');
  });
});
