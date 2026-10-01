import React, { useCallback, useRef, useState } from 'react';
import { isDefaultNoteBackground, hasCustomNoteBackground } from '../../utils/noteAppearance';
import './NoteEditor.css';

const colors = ['#fffdf8', '#f7eee4', '#e9f3ef', '#edf1fa', '#faedf0', '#f7f3df'];
const MAX_BACKGROUND_IMAGE_BYTES = 800 * 1024;
const toDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const NoteEditor = ({ note, isOpen, onClose, onSave, isPrivate = false, initialDate }) => {
  const [title, setTitle] = useState(() => note?.title || '');
  const [content, setContent] = useState(() => note?.content || '');
  const [noteDate, setNoteDate] = useState(() => note?.noteDate || initialDate || new Date().toLocaleDateString('sv-SE'));
  const [backgroundColor, setBackgroundColor] = useState(() => note?.backgroundColor || colors[0]);
  const [backgroundImage, setBackgroundImage] = useState(() => note?.backgroundImage || '');
  const [attachments, setAttachments] = useState(() => note?.attachments || []);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef(null);
  const fileRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const setContentElement = useCallback((element) => {
    contentRef.current = element;
    if (element) element.innerHTML = note?.content || '';
  }, [note?.content]);

  if (!isOpen) return null;

  const format = (command, value) => {
    contentRef.current?.focus();
    document.execCommand(command, false, value);
    setContent(contentRef.current?.innerHTML || '');
  };

  const addFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    const supported = selected.filter((file) => /^(image\/(png|jpeg|webp|gif)|application\/pdf|text\/plain)$/.test(file.type));
    if (supported.length !== selected.length) setError('Chỉ hỗ trợ ảnh PNG, JPG, WebP, GIF, PDF và TXT.');
    if (supported.some((file) => file.size > 800 * 1024)) {
      setError('Mỗi tệp đính kèm cần nhỏ hơn 800 KB.');
      event.target.value = '';
      return;
    }
    if (attachments.length + supported.length > 6) {
      setError('Mỗi ghi chú đính kèm tối đa 6 tệp.');
      event.target.value = '';
      return;
    }
    try {
      const next = await Promise.all(supported.map(async (file) => ({
        name: file.name.slice(0, 120), type: file.type, dataUrl: await toDataUrl(file),
      })));
      setAttachments((current) => [...current, ...next]);
      setError('');
    } catch {
      setError('Không thể đọc tệp đã chọn.');
    }
    event.target.value = '';
  };

  const chooseBackgroundImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Ảnh nền hỗ trợ định dạng PNG, JPG hoặc WebP.');
      return;
    }
    if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
      setError('Ảnh nền cần nhỏ hơn 800 KB.');
      return;
    }
    try {
      setBackgroundImage(await toDataUrl(file));
      setError('');
    } catch {
      setError('Không thể đọc ảnh nền đã chọn.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const body = isPrivate ? content : (contentRef.current?.innerHTML || content);
      await onSave({
        id: note?.id,
        title: title.trim() || (isPrivate ? 'Lưu bút mật' : 'Không tiêu đề'),
        content: body,
        ...(!isPrivate && { noteDate, backgroundColor, backgroundImage, attachments }),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu ghi chú. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay note-editor-overlay" onClick={onClose}>
      <div className="note-editor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{note ? 'Chỉnh sửa ghi chú' : 'Ghi chú mới'}{isPrivate && <span className="private-tag"> · Riêng tư</span>}</h3>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body note-editor-body" style={{ '--note-paper': isDefaultNoteBackground(backgroundColor) ? 'var(--bg-card)' : backgroundColor, '--note-paper-image': backgroundImage ? `linear-gradient(rgba(255, 253, 248, .82), rgba(255, 253, 248, .82)), url("${backgroundImage}")` : 'none' }}>
            {error && <div className="form-error">{error}</div>}
            <input className="editor-title-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tiêu đề" maxLength={160} autoFocus />
            {!isPrivate && <div className="editor-options">
              <label>Ngày <input type="date" value={noteDate} onChange={(event) => setNoteDate(event.target.value)} /></label>
              <div className="note-color-palette" aria-label="Màu nền ghi chú">
                {colors.map((color) => <button key={color} type="button" style={{ background: color }} className={backgroundColor === color ? 'selected' : ''} onClick={() => setBackgroundColor(color)} aria-label={'Nền ' + color} />)}
              </div>
              <div className="note-background-image-control">
                <input ref={backgroundImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseBackgroundImage} hidden />
                <button type="button" className="background-image-button" onClick={() => backgroundImageRef.current?.click()}>{backgroundImage ? 'Đổi ảnh nền' : '＋ Ảnh nền'}</button>
                {backgroundImage && <button type="button" className="background-image-remove" onClick={() => setBackgroundImage('')}>Gỡ ảnh</button>}
              </div>
            </div>}
            {!isPrivate && <div className="rich-toolbar" aria-label="Định dạng chữ">
              <button type="button" onClick={() => format('bold')} title="In đậm"><b>B</b></button>
              <button type="button" onClick={() => format('italic')} title="In nghiêng"><i>I</i></button>
              <button type="button" onClick={() => format('underline')} title="Gạch chân"><u>U</u></button>
              <label title="Màu chữ">A<input type="color" onChange={(event) => format('foreColor', event.target.value)} /></label>
              <button type="button" className="attach-trigger" onClick={() => fileRef.current?.click()} title="Đính kèm tệp">＋ Tệp / ảnh</button>
              <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain" onChange={addFiles} hidden />
            </div>}
            {isPrivate ? <textarea className={"private-note-textarea" + (hasCustomNoteBackground({ backgroundColor, backgroundImage }) ? " custom-paper" : "")} rows="9" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Nội dung ghi chú…" /> : <div ref={setContentElement} className={"rich-content-field" + (hasCustomNoteBackground({ backgroundColor, backgroundImage }) ? " custom-paper" : "")} contentEditable suppressContentEditableWarning onInput={(event) => setContent(event.currentTarget.innerHTML)} data-placeholder="Viết điều bạn muốn nhớ…" />}
            {!isPrivate && attachments.length > 0 && <div className="attachment-list">{attachments.map((item, index) => (
              <div className="attachment-item" key={`${item.name}-${index}`}>
                {item.type?.startsWith('image/') && <img src={item.dataUrl} alt="" />}
                <span>{item.name}</span>
                <button type="button" onClick={() => setAttachments((current) => current.filter((_, i) => i !== index))} aria-label={'Gỡ ' + item.name}>×</button>
              </div>
            ))}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu…' : note ? 'Lưu thay đổi' : 'Tạo ghi chú'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteEditor;
