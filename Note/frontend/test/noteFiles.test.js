import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeFileLinks } from '../src/utils/noteFiles.js';

test('removing an attachment clears every copy of its chip and legacy links, preserving other files', () => {
  const removed = [];
  const link = (name, id, chip = true) => ({
    getAttribute: () => `#note-file-${id}`,
    closest: () => chip ? { remove: () => removed.push(name) } : null,
    remove: () => removed.push(name),
  });
  const editor = { querySelectorAll: () => [link('first chip', 'file_target123'), link('second chip', 'file_target123'), link('legacy link', 'file_target123', false), link('other file', 'file_target1234')] };
  removeFileLinks(editor, 'file_target123');
  assert.deepEqual(removed, ['first chip', 'second chip', 'legacy link']);
});

test('legacy attachments without an ID do not remove any unrelated file links', () => {
  removeFileLinks({ querySelectorAll: () => { throw new Error('Unrelated links must not be changed'); } }, undefined);
  removeFileLinks(null, 'file_target123');
});
