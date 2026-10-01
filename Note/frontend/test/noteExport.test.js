import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWordPackage } from '../src/utils/wordPackage.js';
import { exportFilename, noteToText, noteToWord, downloadNote } from '../src/utils/noteExport.js';

// Read ZIP entries independently of the writer to check the downloaded Office container.
const readZip = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const entries = new Map();
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    assert.equal(view.getUint16(offset + 8, true), 0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLength));
    const start = offset + 30 + nameLength + extraLength;
    entries.set(name, bytes.slice(start, start + size));
    offset = start + size;
  }
  assert.equal(view.getUint32(offset, true), 0x02014b50);
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(bytes.length - 12, true), entries.size);
  return entries;
};
const textEntry = (entries, name) => new TextDecoder().decode(entries.get(name));

test('download filenames preserve Vietnamese and avoid reserved Windows names and invalid characters', () => {
  assert.equal(exportFilename('  Ý tưởng / kế hoạch: tuần?  ', 'txt'), 'Ý tưởng kế hoạch tuần.txt');
  assert.equal(exportFilename('CON', 'docx'), 'Ghi chú CON.docx');
  assert.equal(exportFilename('', 'txt'), 'Không tiêu đề.txt');
  assert.equal(exportFilename('\\/:*?<>|', 'txt'), 'Không tiêu đề.txt');
  assert.equal(exportFilename('Nhật ký...', 'docx'), 'Nhật ký.docx');
  assert.equal(exportFilename('Tiếng Việt\u0000', 'txt'), 'Tiếng Việt.txt');
});

test('TXT export keeps Unicode, line breaks and attachment names without changing a note', () => {
  const note = { title: 'Nhật ký của tôi', content: 'Dòng thứ nhất\nDòng thứ hai ☑', attachments: [{ name: 'Tài liệu.pdf' }] };
  const snapshot = structuredClone(note);
  const text = noteToText(note);
  assert.match(text, /Nhật ký của tôi\n\nDòng thứ nhất\n\nDòng thứ hai ☑/);
  assert.match(text, /Tệp đính kèm\n\nTài liệu.pdf/);
  assert.deepEqual(note, snapshot);
});

test('Word export is a native Office ZIP with Unicode paragraphs and escaped text', async () => {
  const blob = await noteToWord({ title: 'Ghi chú <h1> & hôm nay', content: 'Ý tưởng & kế hoạch\nKhông mất dấu tiếng Việt' });
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const entries = await readZip(blob);
  for (const name of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'word/_rels/document.xml.rels']) assert.ok(entries.has(name));
  const document = textEntry(entries, 'word/document.xml');
  assert.match(document, /Ghi chú &lt;h1&gt; &amp; hôm nay/);
  assert.match(document, /Không mất dấu tiếng Việt/);
  assert.match(document, /xmlns:r="http:\/\/schemas.openxmlformats.org\/officeDocument\/2006\/relationships"/);
  assert.match(textEntry(entries, 'word/styles.xml'), /w:styleId="Title"/);
});

test('Word package preserves format, lists, checklists, images and safe hyperlink relationships', async () => {
  const image = { id: 1, width: 320, height: 180, alt: 'Ảnh "mẫu"', bytes: Uint8Array.of(137, 80, 78, 71) };
  const blob = createWordPackage({
    title: 'Kế hoạch', images: [image], lists: [{ id: 1, type: 'decimal', depth: 0, start: 3 }],
    paragraphs: [
      { style: 'Heading2', runs: [{ text: 'Tiêu đề' }] },
      { listId: 1, depth: 0, runs: [{ text: 'Việc thứ ba', bold: true, italic: true, underline: true, color: '2463eb', size: 14 }] },
      { runs: [{ text: '☑ Đã làm', strike: true }, { break: true }, { image }] },
      { runs: [{ text: 'Tài liệu', href: 'https://example.com/?a=1&b=2' }, { text: 'Không liên kết nguy hiểm', href: 'javascript:alert(1)' }] },
    ],
  });
  const entries = await readZip(blob);
  assert.deepEqual(entries.get('word/media/image1.png'), image.bytes);
  const document = textEntry(entries, 'word/document.xml');
  assert.match(document, /<w:b\/>/); assert.match(document, /<w:i\/>/); assert.match(document, /☑ Đã làm/);
  assert.match(document, /<w:numId w:val="1"\/>/); assert.match(document, /r:embed="image1"/);
  const relationships = textEntry(entries, 'word/_rels/document.xml.rels');
  assert.match(relationships, /a=1&amp;b=2/); assert.doesNotMatch(relationships, /javascript:/);
  assert.match(textEntry(entries, 'word/numbering.xml'), /<w:startOverride w:val="3"\/>/);
});

test('Word text drops XML control characters and rejects unsupported downloads', async () => {
  const entries = await readZip(createWordPackage({ title: 'Tiêu đề\u0000', paragraphs: [{ runs: [{ text: 'Nội dung\u0001' }] }] }));
  assert.equal(textEntry(entries, 'word/document.xml').includes('\u0000'), false);
  assert.equal(textEntry(entries, 'word/document.xml').includes('\u0001'), false);
  await assert.rejects(downloadNote({ title: 'Test' }, 'exe'), /không được hỗ trợ/);
});

test('TXT download uses a UTF-8 BOM, Windows line endings and releases its blob URL', async () => {
  const original = { window: globalThis.window, document: globalThis.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  let blob;
  let cleanup;
  let clicked = false;
  let removed = false;
  let revoked = '';
  const link = { click: () => { clicked = true; }, remove: () => { removed = true; } };
  try {
    globalThis.document = { body: { append: (element) => assert.equal(element, link) }, createElement: () => link };
    globalThis.window = { setTimeout: (callback) => { cleanup = callback; } };
    URL.createObjectURL = (value) => { blob = value; return 'blob:note-test'; };
    URL.revokeObjectURL = (value) => { revoked = value; };
    const filename = await downloadNote({ title: 'Ghi chú', content: 'Tiếng Việt\nDòng thứ hai' }, 'txt');
    assert.equal(filename, 'Ghi chú.txt');
    assert.equal(link.download, filename);
    assert.equal(link.href, 'blob:note-test');
    assert.equal(clicked && removed, true);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    assert.deepEqual(bytes.slice(0, 3), Uint8Array.of(0xef, 0xbb, 0xbf));
    assert.match(await blob.text(), /Tiếng Việt\r\n\r\nDòng thứ hai/);
    cleanup();
    assert.equal(revoked, link.href);
  } finally {
    globalThis.window = original.window;
    globalThis.document = original.document;
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  }
});
