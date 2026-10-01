import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError } from 'axios';
import api from '../src/services/api.js';
import authService from '../src/services/authService.js';
import noteService from '../src/services/noteService.js';

const storage = () => {
  const items = new Map();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
};

test('wrong private password preserves login; private requests require a separate, transient grant', async () => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  let redirect = '';
  globalThis.window = { location: { pathname: '/private-notes', replace: (path) => { redirect = path; } } };
  localStorage.setItem('token', 'account-token');
  localStorage.setItem('user', '{"id":"owner"}');
  const previousAdapter = api.defaults.adapter;
  try {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Wrong private password', 'ERR_BAD_REQUEST', config, null, {
        status: 401, data: { success: false, code: 'PRIVATE_PASSWORD_INVALID' },
      });
    };
    await assert.rejects(authService.verifyPrivatePassword('wrong-secret'));
    assert.equal(localStorage.getItem('token'), 'account-token');
    assert.equal(redirect, '');

    api.defaults.adapter = async (config) => {
      assert.equal(config.url, '/private/auth');
      return { config, status: 200, data: { success: true, privateToken: 'private-grant' } };
    };
    const result = await authService.verifyPrivatePassword('correct-secret');
    api.defaults.adapter = async (config) => {
      assert.equal(config.url, '/private/notes');
      assert.equal(config.headers.get('Authorization'), 'Bearer account-token');
      assert.equal(config.headers.get('X-Private-Token'), result.privateToken);
      return { config, status: 200, data: [] };
    };
    assert.deepEqual(await noteService.getPrivateNotes(result.privateToken), []);
    await assert.rejects(noteService.getPrivateNotes(), /mở khóa/);
    assert.equal(localStorage.getItem('privateToken'), null);
    assert.equal(sessionStorage.getItem('privateToken'), null);

    api.defaults.adapter = async (config) => {
      throw new AxiosError('Account expired', 'ERR_BAD_REQUEST', config, null, { status: 401, data: {} });
    };
    await assert.rejects(noteService.getAllNotes());
    assert.equal(localStorage.getItem('token'), null);
    assert.equal(redirect, '/login');
  } finally {
    api.defaults.adapter = previousAdapter;
  }
});
