import { createWordPackage } from './wordPackage.js';

export const exportFilename = (title, extension) => {
  const name = Array.from(Array.from(String(title || '').normalize('NFC')).filter((character) => character.codePointAt(0) >= 32 && character.codePointAt(0) !== 127).join('').replace(/[<>:"/\\|?*]/g, ' ').replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '')).slice(0, 100).join('') || 'Không tiêu đề';
  return `${/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name) ? `Ghi chú ${name}` : name}.${extension}`;
};

const inlineStyle = (element, inherited = {}) => {
  const style = { ...inherited };
  const tag = element.tagName;
  const css = element.style || {};
  if (['B', 'STRONG'].includes(tag) || /^(bold|[6-9]00)$/.test(css.fontWeight)) style.bold = true;
  if (['I', 'EM'].includes(tag) || css.fontStyle === 'italic') style.italic = true;
  if (tag === 'U' || css.textDecoration?.includes('underline')) style.underline = true;
  if (['S', 'DEL', 'STRIKE'].includes(tag) || css.textDecoration?.includes('line-through')) style.strike = true;
  const color = css.color || element.getAttribute('color') || '';
  if (/^#[0-9a-f]{6}$/i.test(color)) style.color = color.slice(1);
  const rgb = color.match(/^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) style.color = rgb.slice(1, 4).map((number) => Math.min(255, Number(number)).toString(16).padStart(2, '0')).join('');
  const size = css.fontSize?.match(/^(\d+(?:\.\d+)?)(pt|px)$/);
  if (size) style.size = Number(size[1]) * (size[2] === 'px' ? 0.75 : 1);
  return style;
};

export const readNoteContent = (content = '') => {
  if (!/<\/?[a-z][\s\S]*>/i.test(content)) return { paragraphs: String(content).split(/\r?\n/).map((text) => ({ runs: [{ text }] })), lists: [] };
  const root = new DOMParser().parseFromString(String(content), 'text/html').body;
  root.querySelectorAll('script,style,iframe,object,form,noscript,button').forEach((node) => node.remove());
  const lists = [];
  const readInline = (node, inherited = {}) => {
    if (node.nodeType === 3) return [{ ...inherited, text: node.textContent.replace(/\u00a0/g, ' ') }];
    if (node.nodeType !== 1) return [];
    const tag = node.tagName;
    if (['UL', 'OL'].includes(tag)) return [];
    if (tag === 'BR') return [{ break: true }];
    if (tag === 'INPUT') return node.getAttribute('type') === 'checkbox' ? [{ text: node.hasAttribute('checked') ? '☑ ' : '☐ ' }] : [];
    if (tag === 'IMG') return [{ sourceImage: { src: node.getAttribute('src') || '', alt: node.getAttribute('alt') || 'Ảnh', width: node.style.width || node.getAttribute('width'), height: node.style.height || node.getAttribute('height'), ratio: node.style.aspectRatio || '', fit: node.style.objectFit || 'contain', position: node.style.objectPosition || '50% 50%' } }];
    const style = inlineStyle(node, inherited);
    if (tag === 'A' && /^(https?:\/\/|mailto:)/i.test(node.getAttribute('href') || '')) style.href = node.getAttribute('href');
    return Array.from(node.childNodes).flatMap((child) => readInline(child, style));
  };
  const readBlocks = (parent, depth = 0, inherited = {}) => {
    const paragraphs = [];
    let pending = [];
    const flush = () => {
      if (pending.some((run) => run.text?.trim() || run.sourceImage || run.break)) paragraphs.push({ runs: pending });
      pending = [];
    };
    for (const node of parent.childNodes) {
      const tag = node.tagName;
      if (['UL', 'OL'].includes(tag)) {
        flush();
        const list = { id: lists.length + 1, type: tag === 'OL' ? 'decimal' : 'bullet', depth: Math.min(8, depth), start: Math.max(1, Number.parseInt(node.getAttribute('start'), 10) || 1) };
        lists.push(list);
        for (const item of node.children) {
          if (item.tagName !== 'LI') continue;
          const checkbox = item.querySelector('input[type="checkbox"]');
          const contentBlocks = readBlocks(item, depth + 1, inherited);
          const first = contentBlocks.find((paragraph) => !paragraph.listId) || { runs: [] };
          if (!contentBlocks.includes(first)) contentBlocks.unshift(first);
          if (checkbox) first.indent = 360 * (depth + 1);
          else Object.assign(first, { listId: list.id, depth: list.depth });
          paragraphs.push(...contentBlocks);
        }
      } else if (tag && /^(P|DIV|H[1-6]|BLOCKQUOTE|PRE|SECTION|ARTICLE)$/.test(tag)) {
        flush();
        const style = inlineStyle(node, inherited);
        const blocks = readBlocks(node, depth, style);
        if (!blocks.length) blocks.push({ runs: [] });
        for (const block of blocks) {
          if (/^H[1-6]$/.test(tag)) block.style = `Heading${Math.min(3, Number(tag[1]))}`;
          if (node.style.textAlign) block.align = node.style.textAlign;
          if (tag === 'BLOCKQUOTE') block.indent = 480;
        }
        paragraphs.push(...blocks);
      } else if (tag === 'TABLE') {
        flush();
        for (const row of node.querySelectorAll('tr')) {
          paragraphs.push({ runs: Array.from(row.cells).flatMap((cell, index) => [...(index ? [{ text: ' | ' }] : []), ...Array.from(cell.childNodes).flatMap((child) => readInline(child, inherited))]) });
        }
      } else pending.push(...readInline(node, inherited));
    }
    flush();
    return paragraphs;
  };
  return { paragraphs: readBlocks(root), lists };
};

const appendAttachments = (paragraphs, attachments) => {
  if (!attachments?.length) return paragraphs;
  return [...paragraphs, { style: 'Heading3', runs: [{ text: 'Tệp đính kèm' }] }, ...attachments.map((file) => ({ runs: [{ text: file.name || 'Tệp không tên' }] }))];
};

export const noteToText = (note) => {
  const { paragraphs, lists } = readNoteContent(note.content);
  const counters = new Map();
  const lines = appendAttachments(paragraphs, note.attachments).map((paragraph) => {
    let prefix = '';
    if (paragraph.listId) {
      const list = lists.find((item) => item.id === paragraph.listId);
      const number = counters.get(list.id) ?? list.start;
      counters.set(list.id, number + 1);
      prefix = '  '.repeat(paragraph.depth || 0) + (list.type === 'decimal' ? `${number}. ` : '• ');
    }
    return prefix + paragraph.runs.map((run) => run.sourceImage ? `[Ảnh: ${run.sourceImage.alt}]` : run.break ? '\n' : run.text || '').join('');
  });
  return `${String(note.title || '').trim() || 'Không tiêu đề'}\n\n${lines.join('\n\n')}`.replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n';
};

const prepareImage = async (source, id) => {
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(source.src)) return null;
  const image = new Image();
  image.src = source.src;
  try { await image.decode(); } catch { throw new Error('Có ảnh không đọc được. Hãy kiểm tra ảnh trong ghi chú và xuất lại.'); }
  const maxWidth = 640;
  const cssWidth = Number.parseFloat(source.width);
  const cssHeight = Number.parseFloat(source.height);
  let width = Math.min(maxWidth, Math.max(1, Number.isFinite(cssWidth) ? (String(source.width).includes('%') ? maxWidth * cssWidth / 100 : cssWidth) : image.naturalWidth));
  let height = Number.isFinite(cssHeight) ? Math.max(1, cssHeight) : width * image.naturalHeight / image.naturalWidth;
  const ratio = source.ratio?.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!Number.isFinite(cssHeight) && ratio && Number(ratio[1]) > 0 && Number(ratio[2]) > 0) height = width * Number(ratio[2]) / Number(ratio[1]);
  if (height > 850) { width *= 850 / height; height = 850; }
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * 2));
  canvas.height = Math.max(1, Math.round(height * 2));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Trình duyệt không hỗ trợ xuất ảnh. Bạn có thể xuất TXT.');
  const scale = source.fit === 'cover' ? Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) : Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const position = source.position.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  context.drawImage(image, (canvas.width - drawWidth) * Number(position?.[1] ?? 50) / 100, (canvas.height - drawHeight) * Number(position?.[2] ?? 50) / 100, drawWidth, drawHeight);
  const binary = atob(canvas.toDataURL('image/png').split(',')[1]);
  return { id, width, height, alt: source.alt, bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)) };
};

export const noteToWord = async (note) => {
  const { paragraphs, lists } = readNoteContent(note.content);
  const images = [];
  for (const paragraph of paragraphs) {
    for (let index = 0; index < paragraph.runs.length; index += 1) {
      const run = paragraph.runs[index];
      if (!run.sourceImage) continue;
      const image = await prepareImage(run.sourceImage, images.length + 1);
      if (image) {
        images.push(image);
        paragraph.runs[index] = { image };
      } else paragraph.runs[index] = { text: `[Ảnh: ${run.sourceImage.alt}]` };
    }
  }
  return createWordPackage({ title: String(note.title || '').trim() || 'Không tiêu đề', paragraphs: appendAttachments(paragraphs, note.attachments), images, lists });
};

export const downloadNote = async (note, format = 'docx') => {
  if (!['docx', 'txt'].includes(format)) throw new Error('Định dạng xuất không được hỗ trợ.');
  const blob = format === 'txt'
    ? new Blob(['\ufeff', noteToText(note).replace(/\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' })
    : await noteToWord(note);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFilename(note.title, format);
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return link.download;
};
