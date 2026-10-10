import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, onCancel, onConfirm, busy = false, confirmText = 'Chuyển vào thùng rác' }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const busyRef = useRef(busy);
  const cancelHandlerRef = useRef(onCancel);
  useEffect(() => { busyRef.current = busy; cancelHandlerRef.current = onCancel; }, [busy, onCancel]);
  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); cancelHandlerRef.current(); }
      if (event.key !== 'Tab') return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), [tabindex="0"]')];
      if (!controls.length) { event.preventDefault(); return; }
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(<div className="confirm-dialog-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section ref={dialogRef} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy}>
      <div className="confirm-dialog-icon"><Icon name="trash" size={25} /></div>
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{message}</p>
      <div className="confirm-dialog-actions">
        <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy}>Hủy</button>
        <button className="confirm-dialog-delete" type="button" onClick={onConfirm} disabled={busy}>{busy ? 'Đang xóa…' : confirmText}</button>
      </div>
    </section>
  </div>, document.body);
}
