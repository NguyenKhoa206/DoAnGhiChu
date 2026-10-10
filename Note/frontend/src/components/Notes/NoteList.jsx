import React, { useState, useContext } from 'react';
import NoteCard from './NoteCard';
import { formatDate } from '../../utils/formatters';
import './NoteList.css';
import Icon from '../UI/Icon';
import { AppContext } from '../../context/AppContextBase';
import { formatReminder } from '../../utils/noteReminders';

const NoteList = ({
  notes = [],
  onSelectNote,
  onEditNote,
  onDeleteNote,
  onCreateNote,
  isPrivate = false,
  topicName = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { preferences, updatePreferences } = useContext(AppContext);
  const layout = preferences?.noteLayout || localStorage.getItem('nep-note-directory-layout') || 'table';
  const [layoutError, setLayoutError] = useState('');
  const changeLayout = async (noteLayout) => {
    setLayoutError('');
    try { await updatePreferences({ noteLayout }); }
    catch { setLayoutError('Không thể lưu bố cục. Vui lòng thử lại.'); }
  };

  // Tìm kiếm ghi chú theo từ khóa trong Tiêu đề hoặc Nội dung (Search requirement)
  const filteredNotes = notes.filter((note) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (note.title && note.title.toLowerCase().includes(term)) ||
      (note.content && note.content.replace(/<[^>]*>/g, ' ').toLowerCase().includes(term))
    );
  }).sort((a, b) => preferences?.noteSort === 'title' ? (a.title || '').localeCompare(b.title || '', 'vi', { sensitivity: 'base' }) : (preferences?.noteSort === 'oldest' ? 1 : -1) * (new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0)));

  return (
    <div className="note-list-container">
      {/* Header khu vực ghi chú */}
      <div className="note-list-header">
        <div className="header-info">
          <h2>{isPrivate ? 'Ghi chú riêng tư' : topicName || 'Tất cả ghi chú'}</h2>
          <span className="note-count">({filteredNotes.length} ghi chú)</span>
        </div>

        <div className="header-actions">
          <div className="search-bar"><Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Tìm ghi chú" aria-label="Tìm ghi chú"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button type="button" className="clear-search-btn" aria-label="Xóa tìm kiếm" onClick={() => setSearchTerm('')}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {onCreateNote && (
            <button className="btn-create-note" onClick={onCreateNote}>
              <Icon name="plus" size={18} /> Ghi chú mới
            </button>
          )}
          <div className="note-list-layout-toggle" role="group" aria-label="Kiểu hiển thị ghi chú">
            <button type="button" className={layout === 'table' ? 'active' : ''} aria-pressed={layout === 'table'} onClick={() => changeLayout('table')}><Icon name="table" size={16} /> Bảng</button>
            <button type="button" className={layout === 'grid' ? 'active' : ''} aria-pressed={layout === 'grid'} onClick={() => changeLayout('grid')}><Icon name="grid" size={16} /> Lưới</button>
          </div>
        </div>
      </div>

      {layoutError && <p className="field-error" role="alert">{layoutError}</p>}
      {/* Danh sách hiển thị NoteCard */}
      {filteredNotes.length > 0 ? (
        layout === 'table' ? <div className="private-note-table-wrap"><table className="private-note-table"><thead><tr><th>Tên</th><th>Ngày cập nhật</th><th>Thao tác</th></tr></thead><tbody>
          {filteredNotes.map((note) => <tr key={note.id} tabIndex={0} aria-label={`Mở ghi chú ${note.title}`} onClick={() => onSelectNote?.(note)} onKeyDown={(event) => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelectNote?.(note); } }}>
            <td><button className="private-note-table-open" type="button" onClick={(event) => { event.stopPropagation(); onSelectNote?.(note); }}><strong>{note.title || 'Ghi chú chưa có tiêu đề'}</strong><span>{(note.content || 'Chưa có nội dung').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}</span></button></td>
            <td>{note.updatedAt ? formatDate(note.updatedAt) : formatDate(note.createdAt)}{note.reminderAt && <span className="directory-reminder"><Icon name="bell" size={13} />{formatReminder(note.reminderAt)}</span>}</td>
            <td className="private-note-table-actions" onClick={(event) => event.stopPropagation()}>{onEditNote && <button type="button" onClick={() => onEditNote(note)} aria-label="Chỉnh sửa ghi chú">Sửa</button>}{onDeleteNote && <button type="button" onClick={() => onDeleteNote(note.id)} aria-label="Xóa ghi chú"><Icon name="trash" size={15} /></button>}</td>
          </tr>)}
        </tbody></table></div> : <div className="note-grid">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSelect={onSelectNote}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
              isPrivate={isPrivate}
            />
          ))}
        </div>
      ) : (
        <div className="empty-note-state">
          {searchTerm ? (
            <p>Không tìm thấy ghi chú nào phù hợp với từ khóa "<strong>{searchTerm}</strong>".</p>
          ) : (
            <p>Chưa có ghi chú nào trong danh mục này. Hãy bấm <strong>"Ghi chú mới"</strong> để bắt đầu!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteList;
