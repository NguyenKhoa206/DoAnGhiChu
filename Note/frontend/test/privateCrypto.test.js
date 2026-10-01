import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { encryptText, decryptText, estimateEncryptedTextLength } from '../src/utils/crypto.js';

globalThis.window = { crypto: webcrypto };

test('private image payload size predictions match actual ciphertext for Unicode and Base64 content', async () => {
  for (const plaintext of ['', 'Ý tưởng 🖼️', `<p>Ảnh riêng tư</p><img src="data:image/png;base64,${Buffer.alloc(500_000).toString('base64')}">`]) {
    const encrypted = await encryptText(plaintext, 'test-image-secret');
    assert.equal(encrypted.length, estimateEncryptedTextLength(plaintext));
    assert.equal(await decryptText(encrypted, 'test-image-secret'), plaintext);
  }
});

test('private note ciphertext round-trips Unicode content and rejects a wrong password', async () => {
  const plaintext = '<p>Ghi chú riêng tư — nội dung tiếng Việt</p>';
  const encrypted = await encryptText(plaintext, 'old-secret');
  assert.notEqual(encrypted, plaintext);
  assert.equal(encrypted.startsWith('ENC_'), false);
  assert.equal(await decryptText(encrypted, 'old-secret'), plaintext);
  await assert.rejects(decryptText(encrypted, 'wrong-secret'), /Mật khẩu giải mã/);
  const reencrypted = await encryptText(await decryptText(encrypted, 'old-secret'), 'new-secret');
  assert.equal(await decryptText(reencrypted, 'new-secret'), plaintext);
});

test('private encryption fails instead of saving plaintext or Base64 when unavailable', async () => {
  await assert.rejects(encryptText('secret', ''), /mở khóa/);
  const previousCrypto = window.crypto;
  try {
    window.crypto = undefined;
    await assert.rejects(encryptText('secret', 'private-password'), /Không thể mã hóa/);
  } finally {
    window.crypto = previousCrypto;
  }
});

test('legacy private notes remain readable during migration to authenticated encryption', async () => {
  const legacy = `ENC_${btoa(unescape(encodeURIComponent('Ghi chú cũ')))}`;
  assert.equal(await decryptText(legacy, 'private-password'), 'Ghi chú cũ');
});
