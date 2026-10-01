import React from 'react';
import { formatDate } from '../../utils/formatters';
import './NoteDetailModal.css';

const NoteDetailModal = ({ note, isOpen, onClose, onEdit, onDelete, isPrivate = false }) => {
  if (!isOpen || !note) return null;

  const { id, title, content, createdAt, updatedAt } = note;

  const handleEdit = () => {
    onClose();
    if (onEdit) onEdit(note);
  };

  const handleDelete = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ghi chú này không?')) {
      onClose();
      if (onDelete) onDelete(id);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="note-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isPrivate && <span className="private-icon">🔒 </span>}
            {title || 'Ghi chú không có tiêu đề'}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Đóng">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="note-timestamps">
            <span><strong>Tạo lúc:</strong> {formatDate(createdAt)}</span>
            {updatedAt && <span><strong>Cập nhật:</strong> {formatDate(updatedAt)}</span>}
          </div>
          <div className="note-content-display">
            {content ? content : <em>Không có nội dung.</em>}
          </div>
        </div>

        <div className="modal-footer">
          <div className="left-actions">
            {onDelete && (
              <button className="btn-danger" onClick={handleDelete}>
                🗑️ Xóa ghi chú
              </button>
            )}
          </div>
          <div className="right-actions">
            {onEdit && (
              <button className="btn-primary" onClick={handleEdit}>
                ✏️ Chỉnh sửa
              </button>
            )}
            <button className="btn-secondary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailModal;