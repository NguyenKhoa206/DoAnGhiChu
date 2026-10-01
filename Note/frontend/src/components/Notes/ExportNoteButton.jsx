import { useEffect, useId, useRef, useState } from 'react';
import Icon from '../UI/Icon';
import Toast from '../UI/Toast';
import { downloadNote } from '../../utils/noteExport';
import './ExportNoteButton.css';

export default function ExportNoteButton({ getNote }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const container = useRef(null);
  const trigger = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => { if (!container.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const exportNote = async (format) => {
    if (busy) return;
    setBusy(true);
    setOpen(false);
    trigger.current?.focus();
    try {
      const filename = await downloadNote(getNote(), format);
      setToast({ message: `Đã xuất ${filename}`, type: 'success' });
    } catch (error) {
      setToast({ message: error.message || 'Không thể xuất ghi chú. Vui lòng thử lại.', type: 'error' });
    } finally { setBusy(false); }
  };

  return <div className="note-export" ref={container} onBlur={(event) => { if (event.relatedTarget && !container.current?.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="note-export-trigger" aria-label="Xuất ghi chú" title="Xuất ghi chú" aria-expanded={open} aria-controls={id} aria-busy={busy} disabled={busy} onClick={() => setOpen((current) => !current)}><Icon name="download" size={17} /><span>{busy ? 'Đang xuất…' : 'Xuất file'}</span><Icon name="chevron-down" size={14} /></button>
    {open && <div id={id} className="note-export-options" aria-label="Định dạng xuất ghi chú">
      <button type="button" onClick={() => exportNote('docx')}><Icon name="word" /><span><strong>Word (.docx)</strong><small>Giữ văn bản, định dạng và ảnh</small></span></button>
      <button type="button" onClick={() => exportNote('txt')}><Icon name="file-text" /><span><strong>Văn bản (.txt)</strong><small>Tiếng Việt, xuống dòng và checklist</small></span></button>
      <p>Xuất nội dung hiện tại. Tệp đính kèm được liệt kê theo tên.</p>
    </div>}
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </div>;
}
