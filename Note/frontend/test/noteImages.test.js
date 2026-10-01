import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clipboardImageFiles, dataUrlBytes, imageUploadBudget, MAX_IMAGE_BYTES, MAX_IMAGE_INPUT_BYTES, noteMediaSizeError, optimizeNoteImage } from '../src/utils/noteImages.js';

const file = (bytes, type = 'image/png', dimensions = [600, 400]) => Object.assign(new Blob([new Uint8Array(bytes)], { type }), { name: 'Ảnh của tôi.png', dimensions });
const harness = (t, { broken = false, pngRate = .9 } = {}) => {
  const original = { document: globalThis.document, Image: globalThis.Image, FileReader: globalThis.FileReader, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const sources = new Map();
  const revoked = [];
  const encodings = [];
  URL.createObjectURL = (value) => { const key = `blob:test-${sources.size}`; sources.set(key, value); return key; };
  URL.revokeObjectURL = (key) => revoked.push(key);
  globalThis.Image = class {
    set src(value) {
      const [width, height] = sources.get(value).dimensions;
      this.naturalWidth = width; this.naturalHeight = height;
      queueMicrotask(() => broken ? this.onerror() : this.onload());
    }
  };
  globalThis.FileReader = class {
    readAsDataURL(blob) {
      blob.arrayBuffer().then((bytes) => { this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString('base64')}`; this.onload(); });
    }
  };
  globalThis.document = { createElement: (tag) => {
    assert.equal(tag, 'canvas');
    return {
      width: 0, height: 0, getContext: () => ({ drawImage: () => {} }),
      toBlob(callback, type, quality) {
        encodings.push({ width: this.width, height: this.height, type, quality });
        callback(new Blob([new Uint8Array(Math.ceil(this.width * this.height * (type === 'image/png' ? pngRate : .8 * quality)))], { type }));
      },
    };
  } };
  t.after(() => { globalThis.document = original.document; globalThis.Image = original.Image; globalThis.FileReader = original.FileReader; URL.createObjectURL = original.create; URL.revokeObjectURL = original.revoke; });
  return { sources, revoked, encodings };
};

test('data URL byte counts exclude Base64 padding at upload boundaries', () => {
  for (const size of [1, 2, 3, MAX_IMAGE_BYTES - 1, MAX_IMAGE_BYTES]) {
    assert.equal(dataUrlBytes(`data:image/png;base64,${Buffer.alloc(size).toString('base64')}`), size);
  }
  assert.equal(dataUrlBytes('https://example.com/image.png'), 0);
});

test('ordinary notes allow six bounded images without exceeding the request budget', () => {
  const note = { title: 'Ghi chú', content: '<p>Tiếng Việt</p>' };
  const budget = imageUploadBudget(note, 6);
  assert.equal(budget, MAX_IMAGE_BYTES);
  const image = `<img src="data:image/png;base64,${Buffer.alloc(budget).toString('base64')}">`;
  assert.equal(noteMediaSizeError({ ...note, content: note.content + image.repeat(6) }), '');
});

test('private image budgets account for both encryption layers and existing metadata', () => {
  const note = { title: 'Lưu bút mật', content: '<p>Nội dung</p>', isPrivate: true };
  const budget = imageUploadBudget(note, 6);
  assert.ok(budget < MAX_IMAGE_BYTES && budget > 400 * 1024);
  const image = `<img src="data:image/png;base64,${Buffer.alloc(budget).toString('base64')}">`;
  assert.equal(noteMediaSizeError({ ...note, content: note.content + image.repeat(6) }), '');
  const heavyMetadata = { ...note, backgroundImage: `data:image/png;base64,${Buffer.alloc(MAX_IMAGE_BYTES).toString('base64')}`, attachments: [{ name: 'Tài liệu.pdf', dataUrl: `data:application/pdf;base64,${Buffer.alloc(MAX_IMAGE_BYTES).toString('base64')}` }] };
  assert.ok(imageUploadBudget(heavyMetadata, 6) < budget);
  assert.match(noteMediaSizeError({ ...note, content: 'Ả'.repeat(2_000_000) }), /riêng tư đã đầy/);
});

test('full notes report an error before any additional image is inserted', () => {
  const note = { content: 'a'.repeat(5_000_000), isPrivate: true };
  assert.equal(imageUploadBudget(note), 0);
  assert.match(noteMediaSizeError(note), /đã đầy/);
  assert.match(noteMediaSizeError({ content: 'a'.repeat(9_500_000) }), /đã đầy/);
});

test('clipboard image extraction does not duplicate files and supports item-only clipboard data', () => {
  const image = { type: 'image/png' };
  assert.deepEqual(clipboardImageFiles({ files: [image], items: [{ kind: 'file', type: 'image/png', getAsFile: () => image }] }), [image]);
  assert.deepEqual(clipboardImageFiles({ items: [{ kind: 'file', type: 'image/png', getAsFile: () => image }, { kind: 'file', type: 'image/png', getAsFile: () => null }, { kind: 'string', type: 'text/plain' }] }), [image]);
  assert.deepEqual(clipboardImageFiles({ files: [{ type: 'application/pdf' }] }), []);
});

test('image validation rejects unsupported, empty and oversized inputs before allocating a preview', async (t) => {
  const state = harness(t);
  await assert.rejects(optimizeNoteImage({ type: 'image/svg+xml', size: 20 }), /Chỉ hỗ trợ/);
  await assert.rejects(optimizeNoteImage({ type: 'image/png', size: 0 }), /rỗng/);
  await assert.rejects(optimizeNoteImage({ type: 'image/png', size: MAX_IMAGE_INPUT_BYTES + 1 }), /10 MB/);
  assert.equal(state.sources.size, 0);
});

test('small PNG and GIF files retain their original bytes, including animated GIF data', async (t) => {
  const state = harness(t);
  for (const type of ['image/png', 'image/gif']) {
    const input = file(100, type);
    const result = await optimizeNoteImage(input);
    assert.equal(result.type, type);
    assert.equal(result.optimized, false);
    assert.equal(result.dataUrl, `data:${type};base64,${Buffer.alloc(100).toString('base64')}`);
    assert.deepEqual([result.width, result.height], input.dimensions);
  }
  assert.equal(state.encodings.length, 0);
  assert.equal(state.revoked.length, 2);
});

test('large photos are scaled with their aspect ratio and compressed below the stored limit', async (t) => {
  const state = harness(t);
  const result = await optimizeNoteImage(file(3_000_000, 'image/jpeg', [4000, 3000]));
  assert.equal(result.optimized, true);
  assert.ok(result.width <= 1600 && result.size <= MAX_IMAGE_BYTES);
  assert.equal(result.width / result.height, 4 / 3);
  assert.ok(state.encodings.some((entry) => entry.quality < .9));
  assert.equal(state.revoked.length, 1);
});

test('PNG optimization keeps a lossless raster format and respects a tighter private budget', async (t) => {
  const state = harness(t);
  const result = await optimizeNoteImage(file(3_000_000, 'image/png', [3000, 1500]), { maxBytes: 100_000 });
  assert.equal(result.type, 'image/png');
  assert.ok(result.size <= 100_000);
  assert.ok(state.encodings.every((entry) => entry.type === 'image/png' && entry.quality === 1));
  assert.ok(Math.abs(result.width / result.height - 2) < .01);
});

test('GIFs over the available budget are rejected rather than flattened', async (t) => {
  const state = harness(t);
  await assert.rejects(optimizeNoteImage(file(MAX_IMAGE_BYTES + 1, 'image/gif')), /giữ chuyển động/);
  assert.equal(state.encodings.length, 0);
  assert.equal(state.revoked.length, 1);
});

test('corrupt images release their temporary URL and leave the note unchanged', async (t) => {
  const state = harness(t, { broken: true });
  await assert.rejects(optimizeNoteImage(file(100)), /Tệp ảnh bị lỗi/);
  assert.equal(state.revoked.length, 1);
});
