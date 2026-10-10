import React from 'react';
import { formatDate } from '../../utils/formatters';
import { getNoteBackgroundStyle, hasCustomNoteBackground } from '../../utils/noteAppearance';
import './NoteCard.css';
import Icon from '../UI/Icon';

const NoteCard = ({ note, onSelect, onEdit, onDelete, isPrivate = false }) => {
  if (!note) return null;

  const { id, title, content, createdAt, updatedAt } = note;

  // Cắt ngắn nội dung nếu quá dài để hiển thị xem trước (preview)
  const truncateContent = (text, maxLength = 100) => {
    if (!text) return 'Chưa có nội dung...';
    const plain = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plain.length <= maxLength) return plain;
    return plain.substring(0, maxLength) + '...';
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện click vào toàn bộ thẻ
    if (onEdit) onEdit(note);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Tránh kích hoạt sự kiện click vào toàn bộ thẻ
    if (onDelete) onDelete(id);
  };

  return (
    <article className={`note-card ${isPrivate ? 'private-card' : ''}${hasCustomNoteBackground(note) ? ' custom-paper' : ''}`} tabIndex={0} aria-label={`Mở ghi chú ${title}`} style={getNoteBackgroundStyle(note)} onClick={() => onSelect?.(note)} onKeyDown={(event) => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect?.(note); } }}>
      <div className="note-card-header">
        <button type="button" className="note-card-title">
          {title || 'Ghi chú không có tiêu đề'}
        </button>
        <div className="note-card-actions">
          {onEdit && (
            <button 
              className="btn-card-action edit" 
              onClick={handleEditClick} 
              title="Chỉnh sửa ghi chú" aria-label="Chỉnh sửa ghi chú" type="button"
            >
              <Icon name="edit" size={17} />
            </button>
          )}
          {onDelete && (
            <button 
              className="btn-card-action delete" 
              onClick={handleDeleteClick} 
              title="Xóa ghi chú" aria-label="Xóa ghi chú" type="button"
            >
              <Icon name="trash" size={17} />
            </button>
          )}
        </div>
      </div>

      <div className="note-card-body">
        <p className="note-card-excerpt">{truncateContent(content)}</p>
      </div>

      <div className="note-card-footer">
        <span className="note-date">
          {updatedAt ? `Sửa: ${formatDate(updatedAt)}` : `Tạo: ${formatDate(createdAt)}`}
        </span>
      </div>
    </article>
  );
};

export default NoteCard;
