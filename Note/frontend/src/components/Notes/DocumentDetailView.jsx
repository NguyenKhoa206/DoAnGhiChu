import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { isDefaultNoteBackground } from '../../utils/noteAppearance';
import './DocumentDetailView.css';
import Icon from '../UI/Icon';
import ExportNoteButton from './ExportNoteButton';
import NoteImageTools from './NoteImageTools';
import NoteFormattingTools from './NoteFormattingTools';
import { createFileChip, decorateNoteFiles, removeFileLinks } from '../../utils/noteFiles';
import { DEFAULT_TEXT_FORMAT, readTextFormat, selectedTextBlocks, styleSelectedText } from '../../utils/noteRichText';
import { clipboardImageFiles, createAttachmentId, formatImageBytes, imageUploadBudget, MAX_IMAGE_BYTES, MAX_NOTE_MEDIA, noteMediaSizeError, optimizeNoteImage, readFileDataUrl } from '../../utils/noteImages';
import { formatReminder, reminderInstant, toLocalReminderInput } from '../../utils/noteReminders';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value))
  : 'Chưa có thông tin';
const allowedAttachment = /^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/;
const noteBackgroundColors = ['#fffdf8', '#f7eee4', '#e9f3ef', '#edf1fa', '#faedf0', '#f7f3df'];
const getLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const DocumentDetailView = ({ note = {}, draft = null, topics = [], onBack, backLabel = 'Tất cả tài liệu', onSave, onDelete, onDraftChange, onToggleFavorite, onTogglePinned, isPrivate = false, readOnly = false }) => {
  const editorRef = useRef(null);
  const initializedEditorRef = useRef(null);
  const titleInputRef = useRef(null);
  const composingRef = useRef(false);
  const initialContentRef = useRef(draft?.content ?? note.content ?? '');
  const initialFilesRef = useRef({ attachments: draft?.attachments ?? note.attachments ?? [], readOnly });
  const imageInputRef = useRef(null);
  const replacementInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const selectionRef = useRef(null);
  const selectedImageRef = useRef(null);
  const mediaBusyRef = useRef(false);
  const mountedRef = useRef(true);
  const [title, setTitle] = useState(draft?.title ?? note.title ?? '');
  const [content, setContent] = useState(draft?.content ?? note.content ?? '');
  const [attachments, setAttachments] = useState(() => draft?.attachments ?? note.attachments ?? []);
  const [backgroundColor, setBackgroundColor] = useState(draft?.backgroundColor ?? note.backgroundColor ?? '#fffdf8');
  const [backgroundImage, setBackgroundImage] = useState(draft?.backgroundImage ?? note.backgroundImage ?? '');
  const [noteDate, setNoteDate] = useState(() => draft?.noteDate ?? note.noteDate ?? getLocalDate());
  const [reminderInput, setReminderInput] = useState(() => toLocalReminderInput(draft?.reminderAt !== undefined ? draft.reminderAt : note.reminderAt));
  const [reminderValidation, setReminderValidation] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageSelectionVersion, setImageSelectionVersion] = useState(0);
  const [imageEditorWidth, setImageEditorWidth] = useState(600);
  const [imageOverlay, setImageOverlay] = useState(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaFeedback, setMediaFeedback] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [textFormat, setTextFormat] = useState(DEFAULT_TEXT_FORMAT);
  const [initialNoteDate] = useState(noteDate);
  const [savedNote, setSavedNote] = useState(null);
  const [activeTab, setActiveTab] = useState(() => readOnly ? 'Thông tin' : 'Định dạng');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const saveErrorId = useId();
  const documentNote = savedNote || note;
  const selectedTab = readOnly ? 'Thông tin' : activeTab;
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  useEffect(() => {
    if (readOnly) return;
    const changedSelection = () => {
      if (composingRef.current) return;
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const format = readTextFormat(editorRef.current, range);
      if (!format) return;
      selectionRef.current = range.cloneRange();
      setTextFormat((previous) => JSON.stringify(previous) === JSON.stringify(format) ? previous : format);
    };
    document.addEventListener('selectionchange', changedSelection);
    return () => document.removeEventListener('selectionchange', changedSelection);
  }, [readOnly]);
  useEffect(() => {
    const image = selectedImageRef.current;
    if (!selectedImage || !image || !editorRef.current?.contains(image)) { setImageOverlay(null); return; }
    const updateOverlay = () => {
      const box = image.getBoundingClientRect();
      const stage = editorRef.current?.parentElement.getBoundingClientRect();
      if (stage) setImageOverlay({ left: box.left - stage.left, top: box.top - stage.top, width: box.width, height: box.height });
    };
    updateOverlay();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOverlay);
    observer?.observe(image);
    observer?.observe(editorRef.current);
    window.addEventListener('resize', updateOverlay);
    return () => { observer?.disconnect(); window.removeEventListener('resize', updateOverlay); };
  }, [selectedImage, content]);
  const setEditorElement = useCallback((element) => {
    editorRef.current = element;
    if (element && initializedEditorRef.current !== element) {
      initializedEditorRef.current = element;
      element.innerHTML = initialContentRef.current;
      decorateNoteFiles(element, initialFilesRef.current.attachments, initialFilesRef.current.readOnly);
      const drawingBottom = Array.from(element.querySelectorAll('img[style*="position: absolute"]')).reduce((bottom, image) => {
        const top = Number.parseFloat(image.style.top) || 0;
        const height = Number.parseFloat(image.style.height) || image.getBoundingClientRect().height || 0;
        return Math.max(bottom, top + height + 32);
      }, 620);
      element.style.minHeight = `${drawingBottom}px`;
    }
  }, []);
  const topic = topics.find((item) => item.slug === documentNote.topicSlug || item.id === documentNote.topicSlug);
  const changed = title !== (documentNote.title || '') || content !== (documentNote.content || '')
    || JSON.stringify(attachments) !== JSON.stringify(documentNote.attachments || [])
    || backgroundColor !== (documentNote.backgroundColor || '#fffdf8')
    || backgroundImage !== (documentNote.backgroundImage || '')
    || noteDate !== (documentNote.noteDate || initialNoteDate)
    || reminderInput !== toLocalReminderInput(documentNote.reminderAt);

  const rememberSelection = () => {
    if (composingRef.current) return;
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
      const format = readTextFormat(editorRef.current, selectionRef.current);
      if (format) setTextFormat(format);
    }
  };

  const syncContent = () => {
    if (composingRef.current) return;
    if (editorRef.current) {
      const next = editorRef.current.innerHTML;
      setContent(next);
      onDraftChange?.(documentNote.id, { content: next });
    }
  };

  const syncDrawingHeight = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const drawingBottom = Array.from(editor.querySelectorAll('img[style*="position: absolute"]')).reduce((bottom, image) => {
      const top = Number.parseFloat(image.style.top) || 0;
      const height = Number.parseFloat(image.style.height) || image.getBoundingClientRect().height || 0;
      return Math.max(bottom, top + height + 32);
    }, 620);
    editor.style.minHeight = `${drawingBottom}px`;
  };

  const restoreSelection = () => {
    if (composingRef.current) return;
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;
    if (selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)) {
      const saved = selectionRef.current;
      const current = selection.rangeCount ? selection.getRangeAt(0) : null;
      // Replacing an unchanged range clears the browser's pending typing styles.
      // Keep it in place so another click can turn bold/italic/etc. off.
      if (current && current.startContainer === saved.startContainer && current.startOffset === saved.startOffset
        && current.endContainer === saved.endContainer && current.endOffset === saved.endOffset) return;
      selection.removeAllRanges();
      selection.addRange(saved);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const updateSelectedImage = ({ styles = {}, alt }) => {
    const image = selectedImageRef.current;
    if (!image || !editorRef.current?.contains(image)) return;
    Object.entries(styles).forEach(([key, value]) => { image.style[key] = value; });
    if (alt !== undefined) image.alt = alt;
    syncDrawingHeight();
    syncContent();
  };

  const selectImage = (image) => {
    if (readOnly) return;
    selectedImageRef.current = image;
    setImageEditorWidth(editorRef.current?.clientWidth || 600);
    setSelectedImage(image);
    setImageSelectionVersion((version) => version + 1);
    setActiveTab('Ảnh');
    const range = document.createRange();
    range.selectNode(image);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
  };

  const clearSelectedImage = () => {
    selectedImageRef.current = null;
    setSelectedImage(null);
  };

  const removeSelectedImage = () => {
    if (readOnly || mediaBusyRef.current || !selectedImage || !editorRef.current?.contains(selectedImage)) return;
    const range = document.createRange();
    range.setStartBefore(selectedImage);
    range.collapse(true);
    selectedImage.remove();
    clearSelectedImage();
    setActiveTab('Thêm');
    editorRef.current.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
    syncDrawingHeight();
    syncContent();
  };

  const removeAttachment = (attachment) => {
    if (readOnly || mediaBusyRef.current || composingRef.current) return;
    const next = attachments.filter((item) => item !== attachment);
    removeFileLinks(editorRef.current, attachment.id);
    syncContent();
    setAttachments(next);
    onDraftChange?.(documentNote.id, { attachments: next });
    setMediaFeedback({ text: `Đã gỡ ${attachment.name}. Nhấn Lưu để cập nhật.` });
  };

  const applyCommand = (command, value) => {
    if (readOnly || mediaBusyRef.current || composingRef.current) return;
    editorRef.current?.focus({ preventScroll: true });
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    syncContent();
  };

  const applyBlockStyle = (styleName, value) => {
    if (readOnly || mediaBusyRef.current || composingRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus({ preventScroll: true });
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    let range = selection.getRangeAt(0);
    const element = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    if (element?.closest('.note-file-chip')) return;
    let blocks = selectedTextBlocks(editor, range);
    if (!blocks.length) {
      document.execCommand('formatBlock', false, 'P');
      range = selection.getRangeAt(0);
      blocks = selectedTextBlocks(editor, range);
      if (!blocks.length && !editor.textContent.trim() && !editor.querySelector('img,a,input')) {
        const paragraph = document.createElement('p');
        paragraph.append(document.createElement('br'));
        editor.replaceChildren(paragraph);
        range.selectNodeContents(paragraph); range.collapse(true);
        selection.removeAllRanges(); selection.addRange(range);
        blocks = [paragraph];
      }
    }
    for (const block of blocks) block.style[styleName] = value;
    rememberSelection(); syncContent(); setMessage('');
  };

  const applyInlineStyle = (styleName, value) => {
    if (readOnly || mediaBusyRef.current || composingRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus({ preventScroll: true }); restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      applyBlockStyle(styleName, value);
      return;
    }
    const nextRange = styleSelectedText(editor, range, styleName, value);
    if (!nextRange) return;
    selection.removeAllRanges();
    selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange();
    rememberSelection(); syncContent(); setMessage('');
  };

  const clearFormatting = () => {
    if (readOnly || mediaBusyRef.current || composingRef.current || !editorRef.current) return;
    const editor = editorRef.current;
    editor.focus({ preventScroll: true }); restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const clearingCaret = range.collapsed;
    const blocks = selectedTextBlocks(editor, range);
    if (range.collapsed && blocks.length) {
      range.selectNodeContents(blocks[0]);
      selection.removeAllRanges(); selection.addRange(range);
    }
    for (const block of blocks) {
      for (const property of ['fontSize', 'color', 'textAlign', 'lineHeight', 'marginLeft']) block.style[property] = '';
    }
    document.execCommand('removeFormat', false);
    document.execCommand('formatBlock', false, 'P');
    // An empty caret has no text for removeFormat to clean. Reset typing styles
    // explicitly so the next characters start as ordinary text.
    if (clearingCaret) {
      for (const command of ['bold', 'italic', 'underline', 'strikeThrough']) {
        if (document.queryCommandState(command)) document.execCommand(command, false);
      }
    }
    rememberSelection(); syncContent(); setMessage('');
  };

  const currentMediaNote = (overrides = {}) => ({
    title, content: editorRef.current?.innerHTML || '', attachments,
    noteDate, backgroundColor, backgroundImage, isPrivate, ...overrides,
  });

  const importMedia = async (selected, replacement = null) => {
    const editor = editorRef.current;
    if (readOnly || mediaBusyRef.current || !selected.length || !editor) return;
    const insertionRange = selectionRef.current?.cloneRange();
    if (!replacement && selectedImage && insertionRange && insertionRange.startContainer === selectedImage.parentNode
      && insertionRange.endOffset === insertionRange.startOffset + 1
      && insertionRange.startContainer.childNodes[insertionRange.startOffset] === selectedImage) {
      insertionRange.setStartAfter(selectedImage);
      insertionRange.collapse(true);
    }
    const selectedImages = selected.filter((file) => file.type.startsWith('image/'));
    const selectedFiles = selected.filter((file) => !file.type.startsWith('image/'));
    mediaBusyRef.current = true;
    setMediaBusy(true);
    setMediaFeedback({ text: 'Đang xử lý ảnh và tệp…' });
    try {
      if (selected.some((file) => !allowedAttachment.test(file.type))) throw new Error('Chỉ hỗ trợ ảnh PNG, JPG, WebP, GIF, PDF và TXT.');
      if (replacement && (!editor.contains(replacement) || selectedImages.length !== 1 || selectedFiles.length)) throw new Error('Chọn một ảnh để thay thế.');
      if (attachments.length + editor.querySelectorAll('img').length + selected.length - (replacement ? 1 : 0) > MAX_NOTE_MEDIA) throw new Error('Mỗi ghi chú có tối đa 6 ảnh và tệp. Hãy gỡ bớt mục trước khi thêm.');
      if (selectedFiles.some((file) => !file.size || file.size > MAX_IMAGE_BYTES)) throw new Error('Tệp PDF và TXT cần không quá 800 KB.');
      const files = [];
      for (const file of selectedFiles) {
        files.push({ id: createAttachmentId(), name: file.name.slice(0, 120), type: file.type, dataUrl: await readFileDataUrl(file) });
        if (!mountedRef.current) return;
      }
      const nextAttachments = [...attachments, ...files];
      const baseContent = replacement ? editor.innerHTML.replace(replacement.outerHTML, '') : editor.innerHTML;
      const maxBytes = imageUploadBudget(currentMediaNote({ content: baseContent, attachments: nextAttachments }), selectedImages.length || 1);
      const images = [];
      for (let index = 0; index < selectedImages.length; index += 1) {
        setMediaFeedback({ text: `Đang xử lý ảnh ${index + 1}/${selectedImages.length}…` });
        images.push(await optimizeNoteImage(selectedImages[index], { maxBytes }));
        if (!mountedRef.current || editorRef.current !== editor) return;
      }
      if (!mountedRef.current || editorRef.current !== editor) return;
      if (replacement && !editor.contains(replacement)) throw new Error('Ảnh cần thay đã được gỡ khỏi ghi chú.');
      if (attachments.length + editor.querySelectorAll('img').length + selected.length - (replacement ? 1 : 0) > MAX_NOTE_MEDIA) throw new Error('Mỗi ghi chú có tối đa 6 ảnh và tệp.');
      const imageNodes = images.map((image) => {
        const node = replacement ? replacement.cloneNode(false) : document.createElement('img');
        node.src = image.dataUrl;
        node.alt = image.name;
        if (!replacement) node.style.cssText = 'display:block;width:70%;max-width:100%;height:auto;object-fit:contain;object-position:50% 50%;border-radius:8px;margin:16px auto';
        return node;
      });
      const fileNodes = files.map((file) => createFileChip(file));
      const nextContentBase = replacement ? editor.innerHTML.replace(replacement.outerHTML, '') : editor.innerHTML;
      const sizeError = noteMediaSizeError(currentMediaNote({ content: nextContentBase + [...imageNodes, ...fileNodes].map((node) => node.outerHTML).join(''), attachments: nextAttachments }));
      if (sizeError) throw new Error(sizeError);
      if (replacement) {
        replacement.src = images[0].dataUrl;
        replacement.alt = images[0].name;
        selectImage(replacement);
      } else {
        const fragment = document.createDocumentFragment();
        for (const node of [...imageNodes, ...fileNodes]) {
          fragment.append(node, node.tagName === 'IMG' ? document.createElement('br') : document.createTextNode('\u00a0'));
        }
        const lastNode = fragment.lastChild;
        const range = insertionRange && editor.contains(insertionRange.commonAncestorContainer) ? insertionRange : document.createRange();
        if (range !== insertionRange) { range.selectNodeContents(editor); range.collapse(false); }
        range.deleteContents();
        range.insertNode(fragment);
        range.setStartAfter(lastNode); range.collapse(true);
        editor.focus();
        const selection = window.getSelection();
        selection?.removeAllRanges(); selection?.addRange(range);
        selectionRef.current = range.cloneRange();
        // Leave the caret after the inserted content so typing can continue.
        clearSelectedImage();
        if (activeTab === 'Ảnh') setActiveTab('Thêm');
      }
      if (files.length) {
        setAttachments(nextAttachments);
        onDraftChange?.(documentNote.id, { attachments: nextAttachments });
      }
      syncDrawingHeight();
      syncContent();
      const originalBytes = images.reduce((total, image) => total + image.originalSize, 0);
      const storedBytes = images.reduce((total, image) => total + image.size, 0);
      const reduced = storedBytes < originalBytes ? ` (${formatImageBytes(originalBytes)} → ${formatImageBytes(storedBytes)})` : '';
      setMediaFeedback({ text: `${replacement ? 'Đã thay ảnh' : `Đã chèn ${images.length ? `${images.length} ảnh` : ''}${images.length && files.length ? ' và ' : ''}${files.length ? `${files.length} tệp` : ''}`}${reduced}. Nhấn Lưu để cập nhật.` });
      setMessage('Chưa lưu');
    } catch (error) {
      if (mountedRef.current) setMediaFeedback({ text: error.message || 'Không thể xử lý ảnh hoặc tệp đã chọn.', error: true });
    } finally {
      mediaBusyRef.current = false;
      if (mountedRef.current) setMediaBusy(false);
    }
  };

  const addAttachments = (event, replacement = null) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    importMedia(selected, replacement);
  };

  const handleImagePaste = (event) => {
    if (readOnly) return;
    const files = clipboardImageFiles(event.clipboardData);
    if (!files.length) return;
    event.preventDefault();
    rememberSelection();
    importMedia(files);
  };

  const handleMediaDrop = (event) => {
    if (readOnly || !event.dataTransfer.files.length) return;
    event.preventDefault();
    setDragOver(false);
    const editor = editorRef.current;
    let range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (!range && document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (position) { range = document.createRange(); range.setStart(position.offsetNode, position.offset); range.collapse(true); }
    }
    if (range && editor?.contains(range.startContainer)) selectionRef.current = range.cloneRange();
    else selectionRef.current = null;
    importMedia(Array.from(event.dataTransfer.files));
  };

  const handleEditorClickCapture = (event) => {
    const removeButton = event.target.closest?.('button.note-file-remove');
    if (removeButton) {
      event.preventDefault(); event.stopPropagation();
      const file = attachments.find((item) => item.id === removeButton.dataset.fileId);
      if (file) removeAttachment(file);
      return;
    }
    const fileLink = event.target.closest?.('a.note-file-link');
    if (fileLink) {
      event.preventDefault();
      const fileId = fileLink.getAttribute('href')?.replace('#note-file-', '');
      const file = attachments.find((item) => item.id === fileId);
      if (file) {
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.name;
        link.click();
      }
    }
    if (event.target instanceof HTMLImageElement) {
      selectImage(event.target);
    } else if (selectedImage) {
      clearSelectedImage();
      if (activeTab === 'Ảnh') setActiveTab('Định dạng');
    }
    if (event.target instanceof HTMLInputElement && event.target.type === 'checkbox') {
      if (readOnly) { event.preventDefault(); return; }
      const checkbox = event.target;
      window.setTimeout(() => {
        checkbox.toggleAttribute('checked', checkbox.checked);
        syncContent();
      }, 0);
    }
  };

  const insertChecklist = () => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand('insertHTML', false, '<ul class="task-list"><li><input type="checkbox"> <span>Việc cần làm</span></li></ul><p><br></p>');
    rememberSelection();
    syncContent();
  };

  const chooseBackgroundImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || readOnly || mediaBusyRef.current) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMediaFeedback({ text: 'Ảnh nền hỗ trợ định dạng PNG, JPG hoặc WebP.', error: true });
      return;
    }
    mediaBusyRef.current = true;
    setMediaBusy(true);
    setMediaFeedback({ text: 'Đang xử lý ảnh nền…' });
    try {
      const image = await optimizeNoteImage(file);
      if (!mountedRef.current) return;
      const sizeError = noteMediaSizeError(currentMediaNote({ backgroundImage: image.dataUrl }));
      if (sizeError) throw new Error(sizeError);
      setBackgroundImage(image.dataUrl);
      onDraftChange?.(documentNote.id, { backgroundImage: image.dataUrl });
      setMediaFeedback({ text: 'Đã thay ảnh nền. Nhấn Lưu để cập nhật.' });
    } catch (error) {
      if (mountedRef.current) setMediaFeedback({ text: error.message || 'Không thể đọc ảnh nền đã chọn.', error: true });
    } finally {
      mediaBusyRef.current = false;
      if (mountedRef.current) setMediaBusy(false);
    }
  };

  const save = async () => {
    if (readOnly || mediaBusyRef.current || saving || composingRef.current) return;
    setSaving(true);
    setMessage('');
    setSaveError('');
    try {
      const savedTitle = (titleInputRef.current?.value ?? title).normalize('NFC').trim();
      if (!savedTitle) {
        setSaveError('Vui lòng nhập tiêu đề ghi chú, không chỉ gồm khoảng trắng.');
        titleInputRef.current?.focus();
        return;
      }
      const reminderAt = reminderInstant(reminderInput, documentNote.reminderAt);
      if (reminderAt === undefined || (reminderAt && reminderAt !== documentNote.reminderAt && new Date(reminderAt).getTime() <= Date.now())) {
        setActiveTab('Thêm');
        setReminderValidation(reminderAt === undefined ? 'Vui lòng chọn đầy đủ ngày và giờ nhắc.' : 'Thời gian nhắc phải ở trong tương lai.');
        return;
      }
      const changes = { title: savedTitle, content: editorRef.current?.innerHTML ?? content, noteDate, reminderAt, attachments, backgroundColor, backgroundImage };
      const sizeError = noteMediaSizeError({ ...changes, isPrivate });
      if (sizeError) {
        setMediaFeedback({ text: sizeError, error: true });
        return;
      }
      const result = await onSave(documentNote.id || null, changes);
      setTitle(savedTitle);
      if (titleInputRef.current) titleInputRef.current.value = savedTitle;
      setSavedNote({ ...documentNote, ...(result || {}), ...changes });
      setMessage('Đã lưu');
    } catch (error) {
      setSaveError(error.response?.data?.message || error.message || 'Lưu chưa thành công');
    } finally {
      setSaving(false);
    }
  };

  const handleEditorShortcut = (event) => {
    if (readOnly || composingRef.current || event.nativeEvent?.isComposing || event.nativeEvent?.keyCode === 229) return;
    if (event.key === 'Escape' && selectedImage) {
      clearSelectedImage();
      if (activeTab === 'Ảnh') setActiveTab('Định dạng');
    }
    if (['Delete', 'Backspace'].includes(event.key) && selectedImage && event.target === editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (range && range.startContainer === selectedImage.parentNode && range.endContainer === selectedImage.parentNode
        && range.endOffset === range.startOffset + 1 && range.startContainer.childNodes[range.startOffset] === selectedImage) {
        event.preventDefault();
        removeSelectedImage();
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      save();
    }
  };
  const commitTitle = (element) => {
    setTitle(element.value);
    if (element.value.trim()) setSaveError('');
    onDraftChange?.(documentNote.id, { title: element.value });
  };
  const handleCommittedInput = (event) => {
    if (composingRef.current || event.nativeEvent?.isComposing) return;
    syncContent();
    syncDrawingHeight();
    setMessage('');
    if (selectedImage && !event.currentTarget.contains(selectedImage)) {
      clearSelectedImage();
      if (activeTab === 'Ảnh') setActiveTab('Định dạng');
    }
  };
  const handleBack = () => {
    if (!readOnly && (changed || mediaBusy) && !window.confirm('Bạn có thay đổi chưa lưu. Rời khỏi trang ghi chú?')) return;
    onBack?.();
  };

  return (
    <section className="document-detail" aria-label="Chi tiết tài liệu" onKeyDown={handleEditorShortcut}>
      {!readOnly && <>
        <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={addAttachments} />
        <input ref={replacementInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(event) => addAttachments(event, selectedImage)} />
        <input ref={fileInputRef} type="file" accept="application/pdf,text/plain" multiple hidden onChange={addAttachments} />
        <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={chooseBackgroundImage} />
      </>}
      <header className="document-detail-topbar">
        {onBack && <button type="button" className="document-back-button" onClick={handleBack} aria-label={`Quay lại ${backLabel}`}><Icon name="chevron-left" /></button>}
        <div className="document-crumbs"><span>HKT</span><Icon name="chevron-right" size={13} />{onBack ? <button type="button" onClick={handleBack}>{backLabel}</button> : <span>{topic?.name || 'Ghi chú'}</span>}<Icon name="chevron-right" size={13} /><strong>{title || 'Tài liệu chưa có tiêu đề'}</strong></div>
        <div className="document-top-actions">
          <span className="document-save-status">{readOnly ? 'Chỉ xem' : saving ? 'Đang lưu…' : message || (changed ? 'Chưa lưu' : 'Đã lưu')}</span>
          {documentNote.id && onTogglePinned && <button type="button" className={`document-flag-button${documentNote.isPinned ? ' active' : ''}`} aria-label={documentNote.isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'} title={documentNote.isPinned ? 'Bỏ ghim' : 'Ghim'} onClick={async () => { const updated = await onTogglePinned(documentNote); if (updated) setSavedNote({ ...documentNote, ...updated }); }}><Icon name="pin" size={18} /></button>}
          {documentNote.id && onToggleFavorite && <button type="button" className={`document-flag-button${documentNote.isFavorite ? ' active' : ''}`} aria-label={documentNote.isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'} title={documentNote.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} onClick={async () => { const updated = await onToggleFavorite(documentNote); if (updated) setSavedNote({ ...documentNote, ...updated }); }}><Icon name="star" size={18} /></button>}
          {!readOnly && <button type="button" className="document-save-button" onClick={save} disabled={saving || mediaBusy || Boolean(documentNote.id && !changed)}>{saving ? 'Đang lưu' : 'Lưu'}</button>}
          {!readOnly && onDelete && documentNote.id && <button type="button" className="document-more-button" onClick={() => onDelete(documentNote.id)} aria-label="Xóa tài liệu" title="Xóa tài liệu"><Icon name="trash" size={18} /></button>}
          <ExportNoteButton getNote={() => ({ title, content: editorRef.current?.innerHTML ?? content, attachments })} />
        </div>
      </header>

      <div className="document-detail-layout">
        <main className="document-page-area">
          <article className={`document-page${!isDefaultNoteBackground(backgroundColor) ? ' custom-paper' : ''}`} style={{ ...(!isDefaultNoteBackground(backgroundColor) ? { backgroundColor } : {}), ...(backgroundImage ? { backgroundImage: `linear-gradient(var(--paper-image-overlay), var(--paper-image-overlay)), url("${backgroundImage}")` } : {}) }}>
            <div className="document-page-meta"><span>{topic?.name || (isPrivate ? 'Riêng tư' : 'Ghi chú')}</span><span>·</span><span>{documentNote.id ? `Cập nhật ${formatDate(documentNote.updatedAt || documentNote.createdAt)}` : 'Ghi chú mới'}</span></div>
            <input className="document-title-input" aria-label="Tên tài liệu" aria-invalid={Boolean(saveError)} aria-describedby={saveError ? saveErrorId : undefined} placeholder="Tài liệu chưa có tiêu đề" ref={titleInputRef} defaultValue={title} maxLength={160} readOnly={readOnly} onCompositionStart={() => { composingRef.current = true; }} onCompositionEnd={(event) => { composingRef.current = false; commitTitle(event.currentTarget); }} onChange={(event) => { if (!composingRef.current && !event.nativeEvent.isComposing) commitTitle(event.currentTarget); }} />
            {saveError && <p className="document-field-error" id={saveErrorId} role="alert">{saveError}</p>}
            <div className="document-rule" />
            <div className={`document-editor-stage${dragOver ? ' is-dragging' : ''}`}>
              <div
                ref={setEditorElement}
                className="document-body-editor"
                contentEditable={!readOnly}
                suppressContentEditableWarning
                role="textbox"
                aria-label="Nội dung tài liệu"
                aria-multiline="true"
                aria-readonly={readOnly}
                aria-busy={mediaBusy}
                data-placeholder="Bắt đầu viết…"
                onMouseUp={rememberSelection}
                onKeyUp={rememberSelection}
                onClickCapture={handleEditorClickCapture}
                onPaste={handleImagePaste}
                onDrop={handleMediaDrop}
                onDragOver={(event) => { if (!readOnly && Array.from(event.dataTransfer.types).includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = mediaBusy ? 'none' : 'copy'; setDragOver(!mediaBusy); } }}
                onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOver(false); }}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={() => { composingRef.current = false; syncContent(); syncDrawingHeight(); rememberSelection(); }}
                onInput={handleCommittedInput}
              />
              {!readOnly && selectedImage && imageOverlay && <div className="document-image-selection" style={imageOverlay}><button type="button" disabled={mediaBusy || saving} aria-label="Xóa ảnh đang chọn" title="Xóa ảnh" onMouseDown={(event) => event.preventDefault()} onClick={removeSelectedImage}><Icon name="close" size={17} /></button></div>}
              {dragOver && <div className="document-image-drop-hint"><Icon name="image" size={28} /><span>Thả ảnh tại đây để chèn</span></div>}
            </div>
            {mediaFeedback && <div className={`document-media-feedback${mediaFeedback.error ? ' error' : ''}`} role={mediaFeedback.error ? 'alert' : 'status'}><Icon name={mediaFeedback.error ? 'alert' : mediaBusy ? 'image' : 'check'} size={18} /><span>{mediaFeedback.text}</span>{!mediaBusy && <button type="button" aria-label="Ẩn thông báo ảnh" onClick={() => setMediaFeedback(null)}><Icon name="close" size={16} /></button>}</div>}
            {!!attachments.length && <div className="document-attachments" aria-label="Tệp đính kèm">{attachments.map((file, index) => <div className="document-attachment-item" key={file.id || `${file.name}-${index}`}><a href={file.dataUrl} target="_blank" rel="noreferrer" download={file.name}>{file.type?.startsWith('image/') ? <img src={file.dataUrl} alt="" /> : <Icon name="file-text" className="document-file-icon" />}<span>{file.name}</span></a>{!readOnly && <button type="button" disabled={mediaBusy || saving} aria-label={`Gỡ ${file.name}`} title={`Gỡ ${file.name}`} onClick={() => removeAttachment(file)}><Icon name="close" size={16} /></button>}</div>)}</div>}
          </article>
        </main>

        <aside className="document-inspector" aria-label="Công cụ tài liệu">
          <nav className="document-inspector-tabs" role="tablist" aria-label="Bảng công cụ">
            {(readOnly ? ['Thông tin'] : ['Thêm', 'Định dạng', 'Thông tin', ...(selectedImage ? ['Ảnh'] : [])]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={selectedTab === tab} className={selectedTab === tab ? 'active' : ''} onMouseDown={tab === 'Thêm' ? rememberSelection : undefined} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </nav>
          {selectedTab === 'Định dạng' && <div className="document-inspector-content">
            <NoteFormattingTools format={textFormat} disabled={mediaBusy || saving} onRemember={rememberSelection} onCommand={applyCommand} onInlineStyle={applyInlineStyle} onBlockStyle={applyBlockStyle} onChecklist={insertChecklist} onClear={clearFormatting} />
          </div>}
          {selectedTab === 'Thêm' && <div className="document-inspector-content">
            <section className="inspector-section"><h3>Ngày ghi chú</h3><input className="inspector-date-input" type="date" value={noteDate} onChange={(event) => { setNoteDate(event.target.value); onDraftChange?.(documentNote.id, { noteDate: event.target.value }); }} /></section>
            <section className="inspector-section document-reminder-section">
              <h3><Icon name="bell" size={16} /> Hẹn nhắc việc</h3>
              <label className="inspector-hint" htmlFor={`${saveErrorId}-reminder`}>Ngày và giờ nhắc</label>
              <input id={`${saveErrorId}-reminder`} className="inspector-date-input" type="datetime-local" aria-label="Ngày và giờ nhắc" aria-invalid={Boolean(reminderValidation)} value={reminderInput} onChange={(event) => {
                const next = event.target.value;
                setReminderInput(next); setReminderValidation(''); setMessage('');
                onDraftChange?.(documentNote.id, { reminderAt: reminderInstant(next, documentNote.reminderAt) ?? null });
              }} />
              {reminderValidation && <p className="document-field-error" role="alert">{reminderValidation}</p>}
              {reminderInput && <button className="inspector-background-clear" type="button" onClick={() => { setReminderInput(''); setReminderValidation(''); setMessage(''); onDraftChange?.(documentNote.id, { reminderAt: null }); }}>Bỏ lịch nhắc</button>}
              <p className="inspector-hint">Nhấn Lưu để đặt lịch. Giờ nhắc theo máy của bạn. Giữ ứng dụng mở để nhận thông báo đúng giờ; lần mở tiếp theo sẽ hiện việc đã đến hạn.</p>
              {isPrivate && <p className="inspector-hint">Thông báo riêng tư chỉ hiện lời nhắc chung, không hiển thị tiêu đề hay nội dung.</p>}
            </section>
            <section className="inspector-section">
              <h3>Ảnh và tệp</h3>
              <button className="inspector-add-row" type="button" disabled={mediaBusy} onMouseDown={rememberSelection} onClick={() => imageInputRef.current?.click()}><Icon name="image" className="inspector-add-icon" /><span>Chèn ảnh tại vị trí con trỏ</span><Icon name="plus" size={16} /></button>
              <button className="inspector-add-row" type="button" disabled={mediaBusy} onMouseDown={rememberSelection} onClick={() => fileInputRef.current?.click()}><Icon name="paperclip" className="inspector-add-icon" /><span>Đính kèm PDF / TXT</span><Icon name="plus" size={16} /></button>
              <p className="inspector-hint">Chọn nhiều ảnh, kéo thả từ máy hoặc dán ảnh bằng Ctrl/⌘ + V. Ảnh gốc tối đa 10 MB sẽ được giảm dung lượng. GIF, PDF và TXT tối đa 800 KB. Tối đa 6 ảnh và tệp.</p>
              <p className="inspector-hint">Bấm vào ảnh trong ghi chú để căn lề, đổi kích thước, cắt khung hoặc thay ảnh.</p>
              {!!attachments.length && <div className="document-file-manage-list">{attachments.map((file, index) => <div className="document-file-manage-row" key={file.id || `${file.name}-${index}`}><Icon name="paperclip" size={15} /><span>{file.name}</span><button type="button" disabled={mediaBusy} onClick={() => removeAttachment(file)} aria-label={`Gỡ ${file.name}`}><Icon name="close" size={15} /></button></div>)}</div>}
            </section>
            <section className="inspector-section"><h3>Nền ghi chú</h3><div className="document-background-colors" aria-label="Chọn màu nền">{noteBackgroundColors.map((color) => <button type="button" key={color} className={backgroundColor === color ? 'selected' : ''} style={{ '--swatch-color': color }} onClick={() => { setBackgroundColor(color); onDraftChange?.(documentNote.id, { backgroundColor: color }); setMessage('Màu nền đã thay đổi. Nhấn Lưu để cập nhật.'); }} aria-label={`Màu nền ${color}`} title={color} />)}<label className="custom-background-color" title="Chọn màu khác">＋<input type="color" value={backgroundColor} aria-label="Chọn màu nền tùy chỉnh" onChange={(event) => { setBackgroundColor(event.target.value); onDraftChange?.(documentNote.id, { backgroundColor: event.target.value }); setMessage('Màu nền đã thay đổi. Nhấn Lưu để cập nhật.'); }} /></label></div>
              <button className="inspector-background-image-button" type="button" disabled={mediaBusy} onClick={() => backgroundInputRef.current?.click()}>{backgroundImage ? 'Đổi ảnh nền' : '＋ Ảnh nền'}</button>{backgroundImage && <button className="inspector-background-clear" type="button" disabled={mediaBusy} onClick={() => { setBackgroundImage(''); onDraftChange?.(documentNote.id, { backgroundImage: '' }); setMessage('Đã gỡ ảnh nền. Nhấn Lưu để cập nhật.'); }}>Gỡ ảnh nền</button>}<p className="inspector-hint">Ảnh nền PNG, JPG hoặc WebP, tối đa 10 MB; ảnh được tự động giảm dung lượng.</p>
            </section>
          </div>}
          {selectedTab === 'Ảnh' && selectedImage && <div className="document-inspector-content">
            <NoteImageTools key={imageSelectionVersion} image={selectedImage} editorWidth={imageEditorWidth} disabled={mediaBusy || saving} onChange={updateSelectedImage} onReplace={() => replacementInputRef.current?.click()} onRemove={removeSelectedImage} />
          </div>}
          {selectedTab === 'Thông tin' && <div className="document-inspector-content"><section className="inspector-section"><h3>Chi tiết</h3><dl className="document-info-list"><dt>Được tạo</dt><dd>{formatDate(documentNote.createdAt)}</dd><dt>Cập nhật lần cuối</dt><dd>{formatDate(documentNote.updatedAt || documentNote.createdAt)}</dd><dt>Bộ sưu tập</dt><dd>{isPrivate ? 'Riêng tư' : topic?.name || 'Chưa phân loại'}</dd><dt>Ngày ghi chú</dt><dd>{noteDate ? formatDate(`${noteDate}T12:00:00`) : '—'}</dd><dt>Lịch nhắc</dt><dd>{reminderInput ? formatReminder(reminderInstant(reminderInput, documentNote.reminderAt)) : 'Chưa đặt'}</dd></dl></section></div>}
        </aside>
      </div>
    </section>
  );
};

export default DocumentDetailView;
