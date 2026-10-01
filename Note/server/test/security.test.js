const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {
  comparePassword,
  decryptServerData,
  encryptServerData,
  hashPassword,
} = require('../utils/encryption');
const { cleanNoteContent } = require('../utils/noteContent');
const { isValidNoteBackgroundImage, MAX_NOTE_BACKGROUND_BYTES } = require('../utils/noteBackground');

const serverRoot = path.resolve(__dirname, '..');

test('note HTML sanitizer is installed and removes executable markup', () => {
  assert.equal(
    cleanNoteContent('<p>Safe <strong>text</strong></p><script>alert(1)</script><img src="x" onerror="alert(1)">'),
    '<p>Safe <strong>text</strong></p>',
  );
});

test('note HTML sanitizer preserves bounded Word-style font sizes and colors', () => {
  assert.equal(
    cleanNoteContent('<p><span style="font-size: 14pt; color: #336699">Styled text</span><span style="font-size: 200pt">Too large</span></p>'),
    '<p><span style="font-size:14pt;color:#336699">Styled text</span><span>Too large</span></p>',
  );
});

test('note sanitizer preserves safe inline images, checklist boxes, and local file chips', () => {
  const smallImage = `data:image/png;base64,${Buffer.alloc(12).toString('base64')}`;
  const sanitized = cleanNoteContent(`<ul class="task-list"><li><input type="checkbox" checked><span>Done</span></li></ul><img src="${smallImage}" alt="drawing" style="width:70%;height:260px;object-fit:cover;object-position:50% 50%"><a class="note-file-link" href="#note-file-file_abcdef123">file</a>`);
  assert.match(sanitized, /type="checkbox"/);
  assert.match(sanitized, /checked/);
  assert.match(sanitized, /<img src="data:image\/png;base64,/);
  assert.match(sanitized, /href="#note-file-file_abcdef123"/);
  assert.doesNotMatch(cleanNoteContent('<img src="data:image/svg+xml;base64,PHN2Zz4=" onerror="alert(1)">'), /<img/);
  assert.doesNotMatch(cleanNoteContent('<a href="javascript:alert(1)">bad</a>'), /javascript:/);
});

test('note sanitizer keeps bounded absolute positions for drawings placed on the page', () => {
  const smallImage = `data:image/png;base64,${Buffer.alloc(12).toString('base64')}`;
  const sanitized = cleanNoteContent(`<img src="${smallImage}" alt="drawing" style="position:absolute;left:128px;top:410px;width:60px;height:24px;max-width:none;object-fit:contain">`);
  assert.match(sanitized, /position:absolute/);
  assert.match(sanitized, /left:128px/);
  assert.match(sanitized, /top:410px/);
  assert.match(sanitized, /max-width:none/);
  assert.doesNotMatch(cleanNoteContent(`<img src="${smallImage}" style="position:absolute;left:-999px;top:99999px;max-width:none">`), /left:-999px|top:99999px/);
});

test('formatting, image alignment and responsive crop frames survive sanitization', () => {
  const image = `data:image/png;base64,${Buffer.alloc(12).toString('base64')}`;
  const html = cleanNoteContent(`<h1 style="text-align:center;line-height:1.6">Tiêu đề</h1><p style="color:rgb(36, 99, 235);font-size:18pt;margin-left:40px">Văn bản</p><img src="${image}" style="width:50%;max-width:100%;height:auto;aspect-ratio:16 / 9;object-fit:cover;object-position:0% 0%;margin:16px 0 16px auto">`);
  assert.match(html, /<h1 style="text-align:center;line-height:1.6">/);
  assert.match(html, /color:rgb\(36, 99, 235\);font-size:18pt;margin-left:40px/);
  assert.match(html, /aspect-ratio:16 \/ 9/);
  assert.match(html, /object-position:0% 0%/);
  assert.match(html, /margin:16px 0 16px auto/);
  assert.doesNotMatch(cleanNoteContent('<p style="position:fixed;line-height:999;color:expression(alert(1))">Safe</p>'), /position|line-height|expression/);
});

test('attachment remove buttons remain safe and usable after saving', () => {
  const chip = '<span class="note-file-chip" contenteditable="false"><a class="note-file-link" href="#note-file-file_abcdef123">Tài liệu.pdf</a><button type="button" class="note-file-remove" data-file-id="file_abcdef123" aria-label="Gỡ Tài liệu.pdf" onclick="alert(1)">×</button></span>';
  const html = cleanNoteContent(chip);
  assert.match(html, /contenteditable="false"/);
  assert.match(html, /class="note-file-remove" data-file-id="file_abcdef123"/);
  assert.match(html, /×<\/button>/);
  assert.doesNotMatch(html, /onclick/);
  assert.doesNotMatch(cleanNoteContent('<button type="submit" class="note-file-remove" data-file-id="bad">×</button><button onclick="alert(1)">Bad</button>'), /<button/);
});

test('an image exactly at 800 KB is kept, while an oversized image is removed', () => {
  for (const size of [800 * 1024, 800 * 1024 + 1]) {
    const image = `data:image/png;base64,${Buffer.alloc(size).toString('base64')}`;
    assert.equal(cleanNoteContent(`<img src="${image}">`).includes('<img'), size === 800 * 1024);
  }
});

test('note background images accept bounded raster data URLs only', () => {
  const smallPng = `data:image/png;base64,${Buffer.alloc(8).toString('base64')}`;
  const oversizedPng = `data:image/png;base64,${Buffer.alloc(MAX_NOTE_BACKGROUND_BYTES + 1).toString('base64')}`;
  assert.equal(isValidNoteBackgroundImage(smallPng), true);
  assert.equal(isValidNoteBackgroundImage(''), true);
  assert.equal(isValidNoteBackgroundImage(undefined), true);
  assert.equal(isValidNoteBackgroundImage('https://example.com/image.png'), false);
  assert.equal(isValidNoteBackgroundImage('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(isValidNoteBackgroundImage(oversizedPng), false);
});

const runJwtConfig = (overrides = {}) => spawnSync(
  process.execPath,
  ['-e', "const secret = require('./config/jwt'); if (process.env.JWT_SECRET && secret !== process.env.JWT_SECRET) process.exit(2);"],
  {
    cwd: serverRoot,
    encoding: 'utf8',
    env: { ...process.env, ...overrides },
  },
);

test('server encryption round-trips data when a strong key is configured', () => {
  const previousKey = process.env.SERVER_ENCRYPTION_KEY;
  process.env.SERVER_ENCRYPTION_KEY = 'test-only-server-encryption-key-32-bytes';
  try {
    const plaintext = 'Nếp private data test';
    const ciphertext = encryptServerData(plaintext);
    assert.notEqual(ciphertext, plaintext);
    assert.equal(decryptServerData(ciphertext), plaintext);
  } finally {
    if (previousKey === undefined) delete process.env.SERVER_ENCRYPTION_KEY;
    else process.env.SERVER_ENCRYPTION_KEY = previousKey;
  }
});

test('server encryption fails closed when its key is missing', () => {
  const previousKey = process.env.SERVER_ENCRYPTION_KEY;
  const previousConsoleError = console.error;
  delete process.env.SERVER_ENCRYPTION_KEY;
  console.error = () => {};
  try {
    assert.throws(() => encryptServerData('must not be saved as plaintext'), /SERVER_ENCRYPTION_KEY/);
  } finally {
    console.error = previousConsoleError;
    if (previousKey !== undefined) process.env.SERVER_ENCRYPTION_KEY = previousKey;
  }
});

test('server encryption keeps plain-text legacy values readable', () => {
  assert.equal(decryptServerData('legacy note'), 'legacy note');
});

test('account passwords are hashed and verified with bcrypt', async () => {
  const hash = await hashPassword('test-password-123');
  assert.notEqual(hash, 'test-password-123');
  assert.equal(await comparePassword('test-password-123', hash), true);
  assert.equal(await comparePassword('different-password', hash), false);
});

test('production JWT configuration requires a secret of at least 32 bytes', () => {
  for (const secret of ['', 'too-short']) {
    const result = runJwtConfig({ NODE_ENV: 'production', JWT_SECRET: secret });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET must be set to at least 32 bytes/);
  }

  const valid = runJwtConfig({ NODE_ENV: 'production', JWT_SECRET: '0123456789abcdef0123456789abcdef' });
  assert.equal(valid.status, 0, valid.stderr);
});

test('development JWT fallback remains stable across server restarts', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'note-jwt-'));
  const secretFile = path.join(tempDir, 'jwt.secret');
  const env = { ...process.env, NODE_ENV: 'development' };
  delete env.JWT_SECRET;
  env.JWT_SECRET_FILE = secretFile;
  try {
    const script = "process.stdout.write(require('./config/jwt'))";
    const firstRun = spawnSync(process.execPath, ['-e', script], { cwd: serverRoot, encoding: 'utf8', env });
    const secondRun = spawnSync(process.execPath, ['-e', script], { cwd: serverRoot, encoding: 'utf8', env });
    assert.equal(firstRun.status, 0, firstRun.stderr);
    assert.equal(secondRun.status, 0, secondRun.stderr);
    assert.ok(firstRun.stdout.length >= 32);
    assert.equal(secondRun.stdout, firstRun.stdout);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
