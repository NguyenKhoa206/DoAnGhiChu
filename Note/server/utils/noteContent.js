const sanitizeHtml = require('sanitize-html');
const textStyles = {
  color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/],
  'font-size': [/^(?:[8-9]|[1-6][0-9]|7[0-2])pt$/],
  'font-weight': [/^(?:normal|bold|[1-9]00)$/],
  'font-style': [/^(?:normal|italic)$/],
  'text-decoration': [/^(?:none|underline|line-through)(?:\s(?:underline|line-through))?$/],
  'text-decoration-line': [/^(?:none|underline|line-through)(?:\s(?:underline|line-through))?$/],
  'text-align': [/^(?:left|center|right|justify)$/],
  'line-height': [/^(?:1\.4|1\.6|1\.85|2)$/],
  'margin-left': [/^(?:0|\d{1,3}px)$/],
};

const cleanNoteContent = (value) => {
  let inlineImageCount = 0;
  return sanitizeHtml(String(value || ''), {
  allowedTags: ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'span', 'font', 'img', 'input', 'a', 'button'],
  allowedAttributes: {
    p: ['style'], div: ['style'], h1: ['style'], h2: ['style'], h3: ['style'], blockquote: ['style'], li: ['style'], ul: ['class', 'style'], ol: ['style'],
    span: ['style', 'class', { name: 'contenteditable', values: ['false'] }],
    font: ['color'], img: ['src', 'alt', 'style'], input: ['type', 'checked'], a: ['href', 'class'],
    button: [{ name: 'type', values: ['button'] }, 'class', 'data-file-id', 'aria-label', 'title'],
  },
  allowedClasses: { ul: ['task-list'], a: ['note-file-link'], span: ['note-file-chip'], button: ['note-file-remove'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['data'] },
  exclusiveFilter: (frame) => {
    if (frame.tag === 'img') {
      const source = frame.attribs.src || '';
      const match = source.match(/^data:image\/(?:png|jpeg|webp|gif);base64,([A-Za-z0-9+/]*={0,2})$/);
      inlineImageCount += 1;
      const padding = match?.[1].endsWith('==') ? 2 : match?.[1].endsWith('=') ? 1 : 0;
      const byteLength = match ? match[1].length * 3 / 4 - padding : Infinity;
      return !match || byteLength < 1 || byteLength > 800 * 1024 || inlineImageCount > 6;
    }
    if (frame.tag === 'a') return !/^#note-file-[a-zA-Z0-9_-]{6,80}$/.test(frame.attribs.href || '');
    if (frame.tag === 'button') return frame.attribs.class !== 'note-file-remove'
      || frame.attribs.type !== 'button' || !/^file_[a-zA-Z0-9_-]{6,64}$/.test(frame.attribs['data-file-id'] || '');
    return frame.tag === 'input' && frame.attribs.type !== 'checkbox';
  },
  allowedStyles: {
    span: textStyles, p: textStyles, div: textStyles, h1: textStyles, h2: textStyles, h3: textStyles,
    blockquote: textStyles, li: textStyles, ul: textStyles, ol: textStyles,
    img: {
      width: [/^(?:[1-9]|[1-9][0-9]|100)%$/, /^\d{1,4}px$/],
      height: [/^\d{1,4}px$/, /^auto$/],
      'object-fit': [/^(?:cover|contain)$/],
      'object-position': [/^(?:\d{1,3}%\s){1}\d{1,3}%$/],
      'aspect-ratio': [/^(?:1\s*\/\s*1|16\s*\/\s*9|3\s*\/\s*4)$/],
      display: [/^block$/],
      'border-radius': [/^\d{1,2}px$/],
      margin: [/^(?:0|\d{1,2}px|auto)(?:\s(?:0|\d{1,2}px|auto)){0,3}$/],
      position: [/^absolute$/],
      left: [/^\d{1,4}px$/],
      top: [/^\d{1,4}px$/],
      'max-width': [/^(?:none|100%)$/],
    },
  },
  });
};

module.exports = { cleanNoteContent };
