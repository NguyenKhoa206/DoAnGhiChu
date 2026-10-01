export const DEFAULT_TEXT_FORMAT = {
  block: 'P', fontSize: '12', color: '#17243b', bold: false, italic: false,
  underline: false, strikeThrough: false, align: 'left', list: '', lineHeight: '1.85',
};
export const TEXT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const blockSelector = 'p,div,h1,h2,h3,blockquote,li';
const elementFor = (node) => node?.nodeType === 1 ? node : node?.parentElement;
const isProtected = (node) => Boolean(elementFor(node)?.closest('.note-file-chip,[contenteditable="false"]'));
const hexColor = (value) => {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const rgb = value?.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/);
  return rgb ? `#${rgb.slice(1).map((number) => Math.min(255, Number(number)).toString(16).padStart(2, '0')).join('')}` : '#17243b';
};

export const readTextFormat = (editor, range) => {
  if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return null;
  const element = elementFor(range.startContainer) || editor;
  const style = window.getComputedStyle(element);
  const ancestors = [];
  for (let node = element; node && editor.contains(node); node = node.parentElement) ancestors.push(node);
  const block = element.closest(blockSelector);
  const blockStyle = window.getComputedStyle(block && editor.contains(block) ? block : editor);
  const list = element.closest('ul,ol');
  const decoration = ancestors.map((node) => window.getComputedStyle(node).textDecorationLine || '').join(' ');
  const lineHeight = Number.parseFloat(blockStyle.lineHeight) / (Number.parseFloat(blockStyle.fontSize) || 16);
  const commandState = (name) => { try { return document.queryCommandState?.(name) ?? null; } catch { return null; } };
  return {
    block: ['H1', 'H2', 'H3', 'BLOCKQUOTE'].includes(block?.tagName) ? block.tagName : 'P',
    fontSize: String(Math.min(72, Math.max(8, Math.round((Number.parseFloat(style.fontSize) || 16) * .75)))),
    color: hexColor(style.color),
    bold: commandState('bold') ?? (Number(style.fontWeight) >= 600 || style.fontWeight === 'bold'),
    italic: commandState('italic') ?? style.fontStyle === 'italic',
    underline: commandState('underline') ?? (decoration.includes('underline') || ancestors.some((node) => node.tagName === 'U')),
    strikeThrough: commandState('strikeThrough') ?? (decoration.includes('line-through') || ancestors.some((node) => ['S', 'STRIKE', 'DEL'].includes(node.tagName))),
    align: ['left', 'center', 'right', 'justify'].includes(blockStyle.textAlign) ? blockStyle.textAlign : 'left',
    list: list && editor.contains(list) && !list.classList.contains('task-list') ? list.tagName === 'OL' ? 'ordered' : 'bullet' : '',
    lineHeight: Number.isFinite(lineHeight) ? String([1.4, 1.6, 1.85, 2].reduce((best, value) => Math.abs(value - lineHeight) < Math.abs(best - lineHeight) ? value : best, 1.85)) : '1.85',
  };
};

export const selectedTextBlocks = (editor, range) => {
  const element = elementFor(range.startContainer);
  const nearest = element?.closest(blockSelector);
  if (range.collapsed) return nearest && nearest !== editor && editor.contains(nearest) ? [nearest] : [];
  return Array.from(editor.querySelectorAll(blockSelector)).filter((node) => range.intersectsNode(node) && !isProtected(node)
    && !Array.from(node.querySelectorAll(blockSelector)).some((child) => range.intersectsNode(child)));
};

export const styleSelectedText = (editor, range, property, value) => {
  if (!range || !editor.contains(range.commonAncestorContainer) || range.collapsed) return null;
  const walker = document.createTreeWalker(editor, 4);
  const targets = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!range.intersectsNode(node) || isProtected(node)) continue;
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : node.length;
    if (end > start) targets.push({ node, start, end });
  }
  const textNodes = [];
  for (let index = targets.length - 1; index >= 0; index -= 1) {
    const { node, start, end } = targets[index];
    const selected = start ? node.splitText(start) : node;
    if (end - start < selected.length) selected.splitText(end - start);
    const span = document.createElement('span');
    span.style[property] = value;
    selected.replaceWith(span);
    span.append(selected);
    textNodes.unshift(selected);
  }
  if (!textNodes.length) return null;
  const next = document.createRange();
  next.setStart(textNodes[0], 0);
  next.setEnd(textNodes.at(-1), textNodes.at(-1).length);
  return next;
};
