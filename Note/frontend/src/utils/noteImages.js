import { encryptedLengthForBytes, estimateEncryptedTextLength } from './crypto.js';

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_IMAGE_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 800 * 1024;
export const MAX_NOTE_MEDIA = 6;
const PRIVATE_FIELD_LIMIT = 8_000_000;
const NOTE_REQUEST_LIMIT = 9_500_000;
const utf8Bytes = (value) => new TextEncoder().encode(value).byteLength;
const base64Length = (bytes) => 4 * Math.ceil(bytes / 3);

export const formatImageBytes = (bytes) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const dataUrlBytes = (dataUrl = '') => {
  const base64 = dataUrl.match(/^data:[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/)?.[1];
  return base64 ? base64.length * 3 / 4 - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0) : 0;
};

export const readFileDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reader.onabort = () => reject(new Error('Không thể đọc tệp đã chọn.'));
  reader.readAsDataURL(file);
});

export const createAttachmentId = () => `file_${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`}`;

const metadataFor = (note) => ({
  noteDate: note.noteDate,
  attachments: note.attachments || [],
  backgroundColor: note.backgroundColor || '#fffdf8',
  backgroundImage: note.backgroundImage || '',
});

const fitsImageBudget = (note, contentBytes) => {
  const metadataBytes = utf8Bytes(JSON.stringify(metadataFor(note)));
  if (note.isPrivate) {
    const content = encryptedLengthForBytes(contentBytes);
    const metadata = encryptedLengthForBytes(metadataBytes);
    return content <= PRIVATE_FIELD_LIMIT && metadata <= PRIVATE_FIELD_LIMIT
      && content + metadata + estimateEncryptedTextLength(note.title || '') + 2048 <= NOTE_REQUEST_LIMIT;
  }
  return contentBytes + metadataBytes + utf8Bytes(note.title || '') + 2048 <= NOTE_REQUEST_LIMIT;
};

export const imageUploadBudget = (note, imageCount = 1) => {
  const currentBytes = utf8Bytes(note.content || '');
  let low = 0;
  let high = MAX_IMAGE_BYTES;
  while (low < high) {
    const candidate = Math.ceil((low + high) / 2);
    // Reserve space for the image tag, a Unicode filename and safe styles.
    if (fitsImageBudget(note, currentBytes + imageCount * (base64Length(candidate) + 1024))) low = candidate;
    else high = candidate - 1;
  }
  return low;
};

export const noteMediaSizeError = (note) => {
  const metadata = metadataFor(note);
  if (note.isPrivate) {
    const contentSize = estimateEncryptedTextLength(note.content || '');
    const metadataSize = estimateEncryptedTextLength(JSON.stringify(metadata));
    if (contentSize > PRIVATE_FIELD_LIMIT || metadataSize > PRIVATE_FIELD_LIMIT
      || contentSize + metadataSize + estimateEncryptedTextLength(note.title || '') + 2048 > NOTE_REQUEST_LIMIT) {
      return 'Ghi chú riêng tư đã đầy. Hãy giảm ảnh hoặc tệp đính kèm trước khi lưu.';
    }
  } else if (utf8Bytes(JSON.stringify({ title: note.title, content: note.content, ...metadata })) > NOTE_REQUEST_LIMIT) {
    return 'Ghi chú đã đầy. Hãy giảm ảnh hoặc tệp đính kèm trước khi lưu.';
  }
  return '';
};

export const clipboardImageFiles = (clipboard) => {
  const files = Array.from(clipboard?.files || []).filter((file) => file.type.startsWith('image/'));
  if (files.length) return files;
  return Array.from(clipboard?.items || [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile()).filter(Boolean);
};

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Tệp ảnh bị lỗi hoặc không đọc được. Hãy chọn ảnh khác.'));
  image.src = source;
});

const canvasBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Không thể xử lý ảnh. Hãy thử một ảnh khác.')), type, quality);
});

export const optimizeNoteImage = async (file, { maxBytes = MAX_IMAGE_BYTES, maxDimension = 1600 } = {}) => {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh PNG, JPG, WebP và GIF.');
  if (!file.size) throw new Error('Tệp ảnh rỗng. Hãy chọn ảnh khác.');
  if (file.size > MAX_IMAGE_INPUT_BYTES) throw new Error('Ảnh gốc cần không quá 10 MB.');
  if (maxBytes < 16 * 1024) throw new Error('Ghi chú không còn đủ chỗ cho ảnh. Hãy gỡ bớt ảnh hoặc tệp.');
  const source = URL.createObjectURL(file);
  let canvas;
  try {
    const image = await loadImage(source);
    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    if (!originalWidth || !originalHeight || originalWidth * originalHeight > 40_000_000) {
      throw new Error('Kích thước ảnh quá lớn hoặc không hợp lệ. Hãy chọn bản ảnh nhỏ hơn.');
    }
    let blob = file;
    let width = originalWidth;
    let height = originalHeight;
    if (file.type === 'image/gif') {
      if (file.size > maxBytes) throw new Error(`Ảnh GIF cần không quá ${formatImageBytes(maxBytes)} để giữ chuyển động.`);
    } else if (file.size > maxBytes || Math.max(width, height) > maxDimension) {
      canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Trình duyệt không hỗ trợ xử lý ảnh. Hãy thử một trình duyệt khác.');
      let scale = Math.min(1, maxDimension / Math.max(width, height));
      let fitted = false;
      for (let attempt = 0; attempt < 10 && !fitted; attempt += 1) {
        width = Math.max(1, Math.round(originalWidth * scale));
        height = Math.max(1, Math.round(originalHeight * scale));
        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        const qualities = file.type === 'image/png' ? [1] : [0.9, 0.8, 0.7, 0.6];
        for (const quality of qualities) {
          blob = await canvasBlob(canvas, file.type, quality);
          if (blob.size <= maxBytes) { fitted = true; break; }
        }
        scale *= 0.8;
      }
      if (!fitted) throw new Error('Không thể giảm ảnh xuống dung lượng phù hợp. Hãy chọn ảnh nhỏ hơn.');
    }
    return {
      name: (file.name || 'Ảnh đã dán').slice(0, 120),
      type: blob.type,
      dataUrl: await readFileDataUrl(blob),
      size: blob.size, width, height,
      originalSize: file.size,
      optimized: blob !== file,
    };
  } finally {
    URL.revokeObjectURL(source);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
};
