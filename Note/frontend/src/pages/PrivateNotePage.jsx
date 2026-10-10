import React, { useState, useEffect } from 'react';
import noteService, { isPrivateLockedError } from '../services/noteService';
import privateService from '../services/privateService';
import PrivateAuthModal from '../components/UI/PrivateAuthModal';
import NoteList from '../components/Notes/NoteList';
import DocumentDetailView from '../components/Notes/DocumentDetailView';
import Toast from '../components/UI/Toast';
import { encryptText, decryptText } from '../utils/crypto';
import './PrivateNotePage.css';
import Icon from '../components/UI/Icon';
import ConfirmDialog from '../components/UI/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';

const PrivateNotePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticatedPrivate, setIsAuthenticatedPrivate] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [initialLockedUntil, setInitialLockedUntil] = useState(0);
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateToken, setPrivateToken] = useState('');
  
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuthSetup, setCheckingAuthSetup] = useState(true);

  // States quản lý Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const lockPrivateSession = () => {
    setIsAuthenticatedPrivate(false);
    setPrivatePassword('');
    setPrivateToken('');
    setNotes([]);
    setSelectedNote(null);
    setEditingNote(null);
    setIsEditorOpen(false);
    setNoteToDelete(null);
  };

  // 1. Kiểm tra xem user đã thiết lập mật khẩu vùng riêng tư lần nào chưa
  useEffect(() => {
    const checkPrivateSetup = async () => {
      setCheckingAuthSetup(true);
      try {
        const response = await privateService.checkPrivatePasswordStatus();
        const hasSetup = response.data?.hasSetup ?? response?.hasSetup ?? false;
        
        setInitialLockedUntil(response.data?.lockedUntil ?? response.lockedUntil ?? 0);
        setIsFirstTime(!hasSetup);
        setIsAuthModalOpen(true); // Luôn bật Modal xác thực khi mới truy cập trang
      } catch {
        showToast('Không thể kiểm tra trạng thái bảo mật riêng tư.', 'error');
      } finally {
        setCheckingAuthSetup(false);
      }
    };

    checkPrivateSetup();
  }, []);

  useEffect(() => {
    const noteId = searchParams.get('open');
    if (!noteId || !isAuthenticatedPrivate || loading) return;
    const timer = window.setTimeout(() => {
      const note = notes.find((item) => item.id === noteId);
      if (note) { setSelectedNote(note); setIsEditorOpen(false); }
      const next = new URLSearchParams(searchParams); next.delete('open');
      setSearchParams(next, { replace: true });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams, setSearchParams, isAuthenticatedPrivate, loading, notes]);

  // 2. Tải và giải mã danh sách ghi chú riêng tư từ private.json
  const fetchAndDecryptPrivateNotes = async (secretKey, accessToken = privateToken) => {
    setLoading(true);
    try {
      const response = await noteService.getPrivateNotes(accessToken);
      const rawEncryptedNotes = response.data || response || [];

      // Giải mã từng ghi chú bằng khóa bí mật (secretKey/password)
      const decryptedNotes = await Promise.all(rawEncryptedNotes.map(async (note) => ({
        ...note,
        title: await decryptText(note.title, secretKey),
        content: await decryptText(note.content, secretKey),
        ...(note.metadata ? JSON.parse(await decryptText(note.metadata, secretKey)) : {}),
      })));

      setNotes(decryptedNotes);
      return decryptedNotes;
    } catch (error) {
      if (isPrivateLockedError(error)) lockPrivateSession();
      showToast(error.response?.data?.message || 'Không thể tải danh sách ghi chú riêng tư.', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý khi xác thực mật khẩu thành công trong PrivateAuthModal
  const handleAuthSuccess = (passwordEntered, accessToken) => {
    setPrivatePassword(passwordEntered);
    setPrivateToken(accessToken);
    setIsFirstTime(false);
    setIsAuthenticatedPrivate(true);
    setIsAuthModalOpen(false);
    showToast('Xác thực vùng riêng tư thành công!', 'success');
    fetchAndDecryptPrivateNotes(passwordEntered, accessToken).catch(() => {});
  };

  // 4. Lưu mới hoặc Cập nhật ghi chú riêng tư (Mã hóa trước khi gửi lên API)
  const handleSavePrivateNote = async (noteData) => {
    try {
      // Mã hóa tiêu đề và nội dung bằng secret key
      const [encryptedTitle, encryptedContent, encryptedMetadata] = await Promise.all([
        encryptText(noteData.title, privatePassword),
        encryptText(noteData.content, privatePassword),
        encryptText(JSON.stringify({
          noteDate: noteData.noteDate,
          attachments: noteData.attachments || [],
          backgroundColor: noteData.backgroundColor || '#fffdf8',
          backgroundImage: noteData.backgroundImage || '',
        }), privatePassword),
      ]);
      const encryptedPayload = {
        id: noteData.id,
        title: encryptedTitle,
        content: encryptedContent,
        metadata: encryptedMetadata,
        reminderAt: noteData.reminderAt || null,
      };

      let savedResponse;
      if (noteData.id) {
        savedResponse = await noteService.updatePrivateNote(noteData.id, encryptedPayload, privateToken);
        showToast('Đã cập nhật ghi chú riêng tư!', 'success');
      } else {
        savedResponse = await noteService.createPrivateNote(encryptedPayload, privateToken);
        showToast('Đã thêm ghi chú riêng tư mới!', 'success');
      }

      const savedData = savedResponse?.data || savedResponse || {};
      const decrypted = await fetchAndDecryptPrivateNotes(privatePassword);
      return decrypted.find((note) => note.id === (savedData.id || noteData.id)) || {
        ...noteData,
        id: savedData.id || noteData.id,
        createdAt: savedData.createdAt,
        updatedAt: savedData.updatedAt,
      };
    } catch (error) {
      if (isPrivateLockedError(error)) lockPrivateSession();
      showToast(error.response?.data?.message || 'Lỗi khi lưu ghi chú riêng tư.', 'error');
      throw error;
    }
  };

  // 5. Xóa ghi chú riêng tư
  const requestDeletePrivateNote = (noteId) => {
    const note = notes.find((item) => item.id === noteId);
    if (note) setNoteToDelete(note);
  };
  const confirmDeletePrivateNote = async () => {
    if (!noteToDelete || deleting) return;
    setDeleting(true);
    try {
      await noteService.deletePrivateNote(noteToDelete.id, privateToken);
      showToast('Đã xóa ghi chú riêng tư!', 'success');
      setNoteToDelete(null); setSelectedNote(null); setEditingNote(null); setIsEditorOpen(false);
      await fetchAndDecryptPrivateNotes(privatePassword);
    } catch (error) {
      if (isPrivateLockedError(error)) lockPrivateSession();
      showToast(error.response?.data?.message || 'Lỗi khi xóa ghi chú riêng tư.', 'error');
    } finally { setDeleting(false); }
  };

  if (checkingAuthSetup) {
    return <div className="loading-spinner">Đang kiểm tra cấu hình bảo mật...</div>;
  }

  return (
    <div className="private-note-page-container">
      {noteToDelete && <ConfirmDialog title="Xóa ghi chú riêng tư?" message={`“${noteToDelete.title}” sẽ được chuyển vào thùng rác riêng tư. Bạn có thể khôi phục lại sau.`} busy={deleting} onCancel={() => setNoteToDelete(null)} onConfirm={confirmDeletePrivateNote} />}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Modal Xác thực/Cài đặt Mật khẩu riêng tư lần đầu */}
      <PrivateAuthModal
        isOpen={isAuthModalOpen}
        isFirstTime={isFirstTime}
        initialLockedUntil={initialLockedUntil}
        onClose={() => {
          if (!isAuthenticatedPrivate) {
            // Nếu hủy xác thực mà chưa đăng nhập thành công -> ẩn modal và cảnh báo
            setIsAuthModalOpen(false);
          }
        }}
        onSuccess={handleAuthSuccess}
      />

      {!isAuthenticatedPrivate ? (
        <div className="locked-state-card">
          <Icon name="lock" size={44} className="lock-icon" />
          <h2>Ghi chú riêng tư đang khóa</h2>
          <p>
            Vùng riêng tư chứa các ghi chú được mã hóa bảo mật. Bạn cần nhập mật khẩu riêng tư
            để truy cập dữ liệu này.
          </p>
          <button
            className="btn-unlock"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Mở khóa ghi chú
          </button>
        </div>
      ) : !selectedNote && !isEditorOpen ? (
        <div className="private-content-area">
          <div className="private-header-bar">
            <div className="security-badge">
              <Icon name="shield" size={17} /><span>Vùng riêng tư đã mở khóa</span>
            </div>
            <button
              className="btn-lock-session"
              onClick={() => {
                lockPrivateSession();
                showToast('Đã khóa lại vùng riêng tư.', 'info');
              }}
            >
              <Icon name="lock" size={16} /> Khóa lại
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner">Đang giải mã danh sách ghi chú...</div>
          ) : (
            <NoteList
              notes={notes}
              isPrivate={true}
              onSelectNote={(note) => { setSelectedNote(note); setIsEditorOpen(false); }}
              onEditNote={(note) => {
                setSelectedNote(null);
                setEditingNote(note);
                setIsEditorOpen(true);
              }}
              onDeleteNote={requestDeletePrivateNote}
              onCreateNote={() => {
                setSelectedNote(null);
                setEditingNote(null);
                setIsEditorOpen(true);
              }}
            />
          )}
        </div>
      ) : null}

      {isAuthenticatedPrivate && (selectedNote || isEditorOpen) && (
        <DocumentDetailView
          key={selectedNote?.id || editingNote?.id || 'new-private-note'}
          note={selectedNote || editingNote || {}}
          isPrivate
          backLabel="Ghi chú riêng tư"
          onBack={() => { setSelectedNote(null); setIsEditorOpen(false); setEditingNote(null); }}
          onSave={(noteId, changes) => handleSavePrivateNote({ ...changes, id: noteId || undefined })}
          onDelete={requestDeletePrivateNote}
        />
      )}
    </div>
  );
};

export default PrivateNotePage;
