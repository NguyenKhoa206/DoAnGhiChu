import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import noteService from '../services/noteService';
import DocumentDetailView from '../components/Notes/DocumentDetailView';
import Toast from '../components/UI/Toast';
import './DashboardPage.css';
import Icon from '../components/UI/Icon';
import { AppContext } from '../context/AppContextBase';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { formatReminder } from '../utils/noteReminders';

const QuickActions = ({ note, flags, onToggle, onDelete }) => <div className="directory-card-actions" onClick={(event) => event.stopPropagation()}>
  <button type="button" className={note.isPinned || flags.pinned.includes(note.id) ? 'active' : ''} aria-label={note.isPinned ? 'Bỏ ghim' : 'Ghim'} title={note.isPinned ? 'Bỏ ghim' : 'Ghim'} onClick={() => onToggle(note, 'isPinned')}><Icon name="pin" size={17} /></button>
  <button type="button" className={note.isFavorite || flags.favorites.includes(note.id) ? 'active' : ''} aria-label={note.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} title={note.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'} onClick={() => onToggle(note, 'isFavorite')}><Icon name="star" size={17} /></button>
  <button type="button" className="directory-delete-button" aria-label={`Xóa ghi chú ${note.title}`} title="Xóa ghi chú" onClick={() => onDelete(note.id)}><Icon name="trash" size={17} /></button>
</div>;

const dateKey = (value) => {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('sv-SE');
};

const formatDate = (value) => {
  if (!value) return 'Vừa tạo';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short' }).format(new Date(value));
};

const DashboardPage = () => {
  const { user } = useContext(AppContext);
  const { preferences, updatePreferences } = useContext(AppContext);
  const { topicSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState(() => preferences?.noteSort || 'newest');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [detailNote, setDetailNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const directoryLayout = preferences?.noteLayout || localStorage.getItem('nep-note-directory-layout') || 'table';
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const storageKey = 'nep-note-flags-' + (user?.id || user?.userId || user?.username || 'guest');
  const [flags, setFlags] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
        pinned: Array.isArray(saved.pinned) ? saved.pinned : [],
      };
    } catch {
      return { favorites: [], pinned: [] };
    }
  });
  const [noteDrafts, setNoteDrafts] = useState({});
  const searchInputRef = useRef(null);

  const requestedView = searchParams.get('view');
  const currentView = topicSlug ? 'topic' : (['today', 'favorites', 'pinned'].includes(requestedView) ? requestedView : 'all');
  const isDirectoryView = ['all', 'today', 'favorites', 'pinned', 'topic'].includes(currentView);
  const isNewNoteRequested = searchParams.get('new') === '1';

  const changeDirectoryLayout = async (noteLayout) => {
    try { await updatePreferences({ noteLayout }); }
    catch { setToast({ show: true, message: 'Không thể lưu bố cục. Vui lòng thử lại.', type: 'error' }); }
  };

  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [notesResponse, topicsResponse] = await Promise.all([
        noteService.getAllNotes(topicSlug || null),
        noteService.getTopics(),
      ]);
      const nextNotes = notesResponse.data || notesResponse || [];
      setNotes(nextNotes);
      setTopics(topicsResponse.data || topicsResponse || []);
      setSelectedNoteId((previous) => (
        nextNotes.some((note) => note.id === previous) ? previous : (nextNotes[0]?.id || null)
      ));
    } catch (error) {
      showToast(error.response?.data?.message || 'Không tải được ghi chú. Hãy thử tải lại trang.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, topicSlug]);

  useEffect(() => {
    let active = true;
    Promise.all([
      noteService.getAllNotes(topicSlug || null),
      noteService.getTopics(),
    ]).then(([notesResponse, topicsResponse]) => {
      if (!active) return;
      const nextNotes = notesResponse.data || notesResponse || [];
      setNotes(nextNotes);
      setTopics(topicsResponse.data || topicsResponse || []);
      setSelectedNoteId((previous) => (
        nextNotes.some((note) => note.id === previous) ? previous : (nextNotes[0]?.id || null)
      ));
    }).catch((error) => {
      if (active) showToast(error.response?.data?.message || 'Không tải được ghi chú. Hãy thử tải lại trang.', 'error');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [showToast, topicSlug]);

  useEffect(() => {
    const refreshNotes = () => { fetchDashboardData(); };
    window.addEventListener('nep:notes-changed', refreshNotes);
    return () => window.removeEventListener('nep:notes-changed', refreshNotes);
  }, [fetchDashboardData]);

  useEffect(() => {
    const noteId = searchParams.get('open');
    if (!noteId || loading) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        let requested = notes.find((note) => note.id === noteId);
        // A reminder may refer to a note created in another tab.
        if (!requested) {
          const fresh = await noteService.getAllNotes();
          if (!active) return;
          requested = fresh.find((note) => note.id === noteId);
          setNotes(fresh);
        }
        if (requested) setDetailNote(requested);
        else showToast('Ghi chú không còn tồn tại.', 'info');
        const next = new URLSearchParams(searchParams);
        next.delete('open');
        setSearchParams(next, { replace: true });
      } catch (error) { if (active) showToast(error.response?.data?.message || 'Không mở được ghi chú. Hãy thử lại.', 'error'); }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [loading, notes, searchParams, setSearchParams, showToast]);

  const displayedNotes = useMemo(() => {
    const today = dateKey(new Date());
    const needle = searchTerm.trim().toLocaleLowerCase('vi');
    return notes
      .filter((note) => {
        const searchable = ((note.title || '') + ' ' + (note.content || '')).toLocaleLowerCase('vi');
        if (needle && !searchable.includes(needle)) return false;
        if (currentView === 'today') return (note.noteDate || dateKey(note.createdAt)) === today || dateKey(note.reminderAt) === today;
        if (currentView === 'favorites') return note.isFavorite === true || flags.favorites.includes(note.id);
        if (currentView === 'pinned') return note.isPinned === true || flags.pinned.includes(note.id);
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
        if (sortOrder === 'title') return (a.title || '').localeCompare(b.title || '', 'vi', { sensitivity: 'base' });
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });
  }, [currentView, flags.favorites, flags.pinned, notes, searchTerm, sortOrder]);

  const activeNote = displayedNotes.find((note) => note.id === selectedNoteId) || displayedNotes[0] || null;

  const activeDraft = activeNote ? noteDrafts[activeNote.id] : null;
  const draftTitle = activeDraft?.title ?? activeNote?.title ?? '';
  const draftContent = activeDraft?.content ?? activeNote?.content ?? '';
  const hasChanges = Boolean(activeNote && (
    draftTitle !== (activeNote.title || '')
    || draftContent !== (activeNote.content || '')
    || JSON.stringify(activeDraft?.attachments ?? activeNote.attachments ?? []) !== JSON.stringify(activeNote.attachments || [])
    || (activeDraft?.backgroundColor ?? activeNote.backgroundColor ?? '#fffdf8') !== (activeNote.backgroundColor || '#fffdf8')
    || (activeDraft?.backgroundImage ?? activeNote.backgroundImage ?? '') !== (activeNote.backgroundImage || '')
  ));

  const updateActiveDraft = (changes) => {
    if (!activeNote) return;
    updateNoteDraft(activeNote.id, changes);
  };

  const updateNoteDraft = (noteId, changes) => {
    if (!noteId) return;
    const sourceNote = notes.find((note) => note.id === noteId) || {};
    setNoteDrafts((current) => ({
      ...current,
      [noteId]: {
        title: current[noteId]?.title ?? sourceNote.title ?? '',
        content: current[noteId]?.content ?? sourceNote.content ?? '',
        attachments: current[noteId]?.attachments ?? sourceNote.attachments ?? [],
        backgroundColor: current[noteId]?.backgroundColor ?? sourceNote.backgroundColor ?? '#fffdf8',
        backgroundImage: current[noteId]?.backgroundImage ?? sourceNote.backgroundImage ?? '',
        noteDate: current[noteId]?.noteDate ?? sourceNote.noteDate,
        reminderAt: current[noteId]?.reminderAt !== undefined ? current[noteId].reminderAt : sourceNote.reminderAt || null,
        ...changes,
      },
    }));
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
    if (isNewNoteRequested) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const viewTitles = {
    all: 'Tất cả tài liệu',
    today: 'Hôm nay',
    favorites: 'Yêu thích',
    pinned: 'Đã ghim',
    topic: topics.find((topic) => topic.slug === topicSlug || topic.id === topicSlug)?.name || 'Chủ đề',
  };
  const viewTitle = viewTitles[currentView] || 'Tất cả tài liệu';

  const handleCreateOrUpdate = async (noteData) => {
    try {
      let savedNote;
      const createFromView = !noteData.id;
      const topicForNewNote = topicSlug || noteData.topicSlug || '';
      const savePayload = {
        ...noteData,
        ...(!noteData.id && {
          topicSlug: topicForNewNote,
          isFavorite: currentView === 'favorites' || noteData.isFavorite === true,
          isPinned: currentView === 'pinned' || noteData.isPinned === true,
        }),
      };
      if (noteData.id) {
        const response = await noteService.updateNote(noteData.id, savePayload);
        savedNote = response.data || response;
        showToast('Đã cập nhật ghi chú.', 'success');
      } else {
        const response = await noteService.createNote(savePayload);
        savedNote = response.data || response;
        showToast('Đã tạo ghi chú mới.', 'success');
      }
      if (createFromView && savedNote?.id && (savedNote.isFavorite || savedNote.isPinned)) {
        setFlags((current) => {
          const next = {
            favorites: savedNote.isFavorite ? [...new Set([...current.favorites, savedNote.id])] : current.favorites,
            pinned: savedNote.isPinned ? [...new Set([...current.pinned, savedNote.id])] : current.pinned,
          };
          localStorage.setItem(storageKey, JSON.stringify(next));
          return next;
        });
      }
      if (noteData.id) setNoteDrafts((current) => {
        const next = { ...current };
        delete next[noteData.id];
        return next;
      });
      if (savedNote?.id) setSelectedNoteId(savedNote.id);
      await fetchDashboardData();
      return savedNote;
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu ghi chú.', 'error');
      throw error;
    }
  };

  const saveDraft = useCallback(async () => {
    if (!activeNote) return;
    try {
      const response = await noteService.updateNote(activeNote.id, {
        ...activeDraft,
        title: draftTitle.trim() || 'Không tiêu đề',
        content: draftContent.trim(),
      });
      const savedNote = response.data || response;
      setNotes((current) => current.map((note) => note.id === activeNote.id ? { ...note, ...savedNote } : note));
      setNoteDrafts((current) => {
        const next = { ...current };
        delete next[activeNote.id];
        return next;
      });
      showToast('Đã lưu ghi chú.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu ghi chú.', 'error');
    }
  }, [activeDraft, activeNote, draftContent, draftTitle, showToast]);

  const saveDashboardDocument = async (noteId, changes) => handleCreateOrUpdate({
    ...changes,
    id: noteId || undefined,
    ...(!noteId && { noteDate: changes.noteDate || new Date().toLocaleDateString('sv-SE') }),
  });

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLocaleLowerCase('vi');
      if (key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (key === 'n') {
        event.preventDefault();
        setEditingNote(null);
        setIsEditorOpen(true);
      } else if (key === 's' && !event.target.closest('.note-editor-modal')) {
        event.preventDefault();
        if (hasChanges) saveDraft();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [hasChanges, saveDraft]);

  const selectNote = (note) => {
    if (hasChanges && !window.confirm('Bạn có thay đổi chưa lưu. Bỏ thay đổi và mở ghi chú khác?')) return;
    setSelectedNoteId(note.id);
  };

  const requestDeleteNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId) || detailNote || editingNote;
    if (note?.id) setNoteToDelete(note);
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete || deleting) return;
    const { id: noteId, topicSlug: deletedTopic } = noteToDelete;
    setDeleting(true);
    try {
      await noteService.deleteNote(noteId, deletedTopic);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setFlags((current) => {
        const next = {
          favorites: current.favorites.filter((id) => id !== noteId),
          pinned: current.pinned.filter((id) => id !== noteId),
        };
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      setDetailNote((current) => current?.id === noteId ? null : current);
      setNoteDrafts((current) => { const next = { ...current }; delete next[noteId]; return next; });
      if (editingNote?.id === noteId || isEditorOpen || isNewNoteRequested) closeEditor();
      if (selectedNoteId === noteId) setSelectedNoteId(null);
      setNoteToDelete(null);
      showToast('Đã chuyển ghi chú vào thùng rác.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể xóa ghi chú.', 'error');
    } finally { setDeleting(false); }
  };

  const saveDirectoryNote = async (noteId, changes) => {
    try {
      const response = await noteService.updateNote(noteId, changes);
      const savedNote = response.data || response;
      const updatedNote = { ...detailNote, ...changes, ...savedNote };
      setNotes((current) => current.map((note) => note.id === noteId ? updatedNote : note));
      setDetailNote(updatedNote);
      setNoteDrafts((current) => { const next = { ...current }; delete next[noteId]; return next; });
      showToast('Đã lưu tài liệu.', 'success');
      return updatedNote;
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu tài liệu.', 'error');
      throw error;
    }
  };

  const toggleNoteFlag = async (note, flag) => {
    if (!note?.id) return null;
    const nextValue = !(note[flag] || flags[flag === 'isFavorite' ? 'favorites' : 'pinned'].includes(note.id));
    try {
      const response = await noteService.updateNote(note.id, { [flag]: nextValue });
      const saved = response.data || response;
      setNotes((current) => current.map((item) => item.id === note.id ? { ...item, ...saved } : item));
      setDetailNote((current) => current?.id === note.id ? { ...current, ...saved } : current);
      setFlags((current) => {
        const key = flag === 'isFavorite' ? 'favorites' : 'pinned';
        const ids = new Set(current[key]);
        if (nextValue) ids.add(note.id); else ids.delete(note.id);
        const next = { ...current, [key]: [...ids] };
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
      showToast(nextValue ? (flag === 'isFavorite' ? 'Đã thêm vào yêu thích.' : 'Đã ghim ghi chú.') : (flag === 'isFavorite' ? 'Đã bỏ yêu thích.' : 'Đã bỏ ghim.'), 'success');
      return { ...note, ...saved };
    } catch (error) {
      showToast(error.response?.data?.message || 'Không cập nhật được ghi chú.', 'error');
      return null;
    }
  };

  return (
    <div className="nep-dashboard">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      )}
      {noteToDelete && <ConfirmDialog title="Xóa ghi chú?" message={`“${noteToDelete.title}” sẽ được chuyển vào thùng rác. Bạn có thể khôi phục lại sau.`} busy={deleting} onCancel={() => setNoteToDelete(null)} onConfirm={confirmDeleteNote} />}

      {isDirectoryView && detailNote ? (
        <DocumentDetailView
          key={detailNote.id}
          note={detailNote}
          draft={noteDrafts[detailNote.id]}
          topics={topics}
          onDraftChange={updateNoteDraft}
          onBack={() => setDetailNote(null)}
          onSave={saveDirectoryNote}
          onDelete={requestDeleteNote}
          onToggleFavorite={(note) => toggleNoteFlag(note, 'isFavorite')}
          onTogglePinned={(note) => toggleNoteFlag(note, 'isPinned')}
        />
      ) : (isEditorOpen || isNewNoteRequested) ? (
        <DocumentDetailView
          key={editingNote?.id || 'dashboard-new-note'}
          note={editingNote || { noteDate: new Date().toLocaleDateString('sv-SE') }}
          draft={editingNote ? noteDrafts[editingNote.id] : null}
          topics={topics}
          backLabel={viewTitle}
          onDraftChange={updateNoteDraft}
          onBack={closeEditor}
          onSave={(noteId, changes) => handleCreateOrUpdate({ ...changes, id: noteId || undefined })}
          onDelete={requestDeleteNote}
        />
      ) : <div className={'nep-workspace' + (isDirectoryView ? ' all-notes-workspace' : '')}>
        <aside className={'note-browser' + (isDirectoryView ? ' all-notes-browser' : '')}>
          <div className="browser-heading">
            <div>
              <p className="nep-eyebrow">SỔ TAY CỦA BẠN</p>
              <h2>{viewTitle}</h2>
            </div>
            <span className="note-count">{displayedNotes.length} ghi chú</span>
            <button type="button" className="dashboard-create-button" onClick={() => { setEditingNote(null); setIsEditorOpen(true); }}><Icon name="plus" size={18} />Ghi chú mới</button>
            {isDirectoryView && (
              <div className="directory-view-toggle" role="group" aria-label="Kiểu hiển thị tài liệu">
                <button type="button" className={directoryLayout === 'table' ? 'active' : ''} aria-pressed={directoryLayout === 'table'} onClick={() => changeDirectoryLayout('table')}><Icon name="table" size={16} /> <span>Bảng</span></button>
                <button type="button" className={directoryLayout === 'grid' ? 'active' : ''} aria-pressed={directoryLayout === 'grid'} onClick={() => changeDirectoryLayout('grid')}><Icon name="grid" size={16} /> <span>Lưới</span></button>
              </div>
            )}
          </div>

          <p className="browser-description">{({ today: 'Những ghi chú và việc có lịch nhắc trong hôm nay.', favorites: 'Các ghi chú bạn muốn tìm lại nhanh.', pinned: 'Các ghi chú quan trọng.', topic: 'Tài liệu trong bộ sưu tập của bạn.' }[currentView] || 'Một nơi để lưu ý tưởng, kế hoạch và những điều cần nhớ.')}</p>
          <div className="browser-tools">
            <label className="note-search">
              <Icon name="search" size={18} />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Tìm ghi chú"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Tìm ghi chú"
              />
              <kbd>{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'}</kbd>
            </label>
            <label className="sort-control">
              <span>Sắp xếp</span>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sắp xếp ghi chú">
                <option value="newest">Mới cập nhật</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Tên A–Z</option>
              </select>
            </label>
          </div>

          {isDirectoryView ? (
            loading ? <div className="note-list-message">Đang tải tài liệu…</div> : displayedNotes.length ? (
              directoryLayout === 'table' ? (
                <div className="directory-table-scroll">
                  <table className="directory-table">
                    <thead><tr><th>Tên</th><th>Bộ sưu tập</th><th>Đã cập nhật</th><th>Thao tác</th></tr></thead>
                    <tbody>{displayedNotes.map((note) => (
                      <tr key={note.id} className="directory-clickable-row" tabIndex={0} aria-label={`Mở ghi chú ${note.title}`} onClick={() => setDetailNote(note)} onKeyDown={(event) => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); setDetailNote(note); } }}>
                        <td>
                          <button type="button" className="directory-note-link" onClick={(event) => { event.stopPropagation(); setDetailNote(note); }}>
                            <strong className="directory-note-title">{note.title || 'Ghi chú chưa có tiêu đề'}</strong>
                            <span className="directory-note-preview">{(note.content || 'Tài liệu trống').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 130)}</span>
                          </button>
                        </td>
                        <td>{topics.find((topic) => topic.slug === note.topicSlug || topic.id === note.topicSlug)?.name || '—'}</td>
                        <td>{formatDate(note.updatedAt || note.createdAt)}{note.reminderAt && <span className="directory-reminder"><Icon name="bell" size={13} />{formatReminder(note.reminderAt)}</span>}</td>
                        <td className="directory-note-actions-cell">
                          <QuickActions note={note} flags={flags} onToggle={toggleNoteFlag} onDelete={requestDeleteNote} />
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : (
                <div className="directory-card-grid">
                  {displayedNotes.map((note) => (
                    <article className="directory-card" key={note.id} tabIndex={0} aria-label={`Mở ghi chú ${note.title}`} onClick={() => setDetailNote(note)} onKeyDown={(event) => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); setDetailNote(note); } }}>
                      <div className="directory-card-head"><button type="button" className="directory-card-title-button" onClick={(event) => { event.stopPropagation(); setDetailNote(note); }}><strong className="directory-note-title">{note.title || 'Ghi chú chưa có tiêu đề'}</strong></button><QuickActions note={note} flags={flags} onToggle={toggleNoteFlag} onDelete={requestDeleteNote} /></div>
                      <span className="directory-card-meta">Đã cập nhật {formatDate(note.updatedAt || note.createdAt)}</span>
                      <span className="directory-note-preview">{(note.content || 'Tài liệu trống').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)}</span>
                      {note.reminderAt && <span className="directory-reminder"><Icon name="bell" size={13} />{formatReminder(note.reminderAt)}</span>}
                      <span className="directory-card-topic">{topics.find((topic) => topic.slug === note.topicSlug || topic.id === note.topicSlug)?.name || 'Chưa phân loại'}</span>
                    </article>
                  ))}
                </div>
              )
            ) : (
              <div className="note-list-message directory-empty">
                <Icon name="files" size={36} className="empty-note-icon" />
                <strong>{searchTerm ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu'}</strong>
                <span>{searchTerm ? 'Thử từ khóa khác nhé.' : 'Tạo một tài liệu mới để bắt đầu.'}</span>
              </div>
            )
          ) : (
            <div className="note-list" aria-live="polite">
              {loading ? (
                <div className="note-list-message">Đang tải sổ tay…</div>
              ) : displayedNotes.length ? displayedNotes.map((note) => (
                <button
                  className={'note-row' + (activeNote?.id === note.id ? ' selected' : '')}
                  key={note.id}
                  onClick={() => selectNote(note)}
                  type="button"
                >
                  <span className="note-row-top">
                    <span className="note-row-title">{note.title || 'Ghi chú chưa có tiêu đề'}</span>
                    <span className="note-row-date">{formatDate(note.updatedAt || note.createdAt)}</span>
                  </span>
                  <span className="note-row-preview">{(note.content || 'Bắt đầu viết điều bạn muốn nhớ…').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 94)}</span>
                  <span className="note-row-meta">
                    {note.topicSlug ? <span>{topics.find((topic) => topic.slug === note.topicSlug || topic.id === note.topicSlug)?.name || note.topicSlug}</span> : <span>Ghi chú</span>}
                    {flags.favorites.includes(note.id) && <Icon name="star" size={14} />}
                    {flags.pinned.includes(note.id) && <Icon name="pin" size={14} />}
                  </span>
                </button>
              )) : (
                <div className="note-list-message">
                  <Icon name="files" size={36} className="empty-note-icon" />
                  <strong>{searchTerm ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú ở đây'}</strong>
                  <span>{searchTerm ? 'Thử từ khóa khác nhé.' : 'Tạo một ghi chú mới để bắt đầu.'}</span>
                </div>
              )}
            </div>
          )}

          {!isDirectoryView && <button
            className="new-note-inline"
            type="button"
            onClick={() => { setEditingNote(null); setIsEditorOpen(true); }}
          >
            <Icon name="plus" size={18} /> Ghi chú mới
          </button>}
        </aside>

        {!isDirectoryView && <section className="note-canvas" aria-label="Nội dung ghi chú">
          <DocumentDetailView
            key={activeNote?.id || 'dashboard-empty-note'}
            note={activeNote || { noteDate: new Date().toLocaleDateString('sv-SE') }}
            draft={activeDraft}
            topics={topics}
            onDraftChange={(noteId, changes) => { if (noteId) updateActiveDraft(changes); }}
            onSave={saveDashboardDocument}
            onDelete={activeNote ? requestDeleteNote : undefined}
            onToggleFavorite={(note) => toggleNoteFlag(note, 'isFavorite')}
            onTogglePinned={(note) => toggleNoteFlag(note, 'isPinned')}
          />
        </section>}
      </div>}

    </div>
  );
};

export default DashboardPage;
