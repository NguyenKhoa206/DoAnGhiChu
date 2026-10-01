import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService, { isPrivateLockedError } from '../services/noteService';
import authService from '../services/authService';
import PrivateAuthModal from '../components/UI/PrivateAuthModal';
import Toast from '../components/UI/Toast';
import { decryptText } from '../utils/crypto';
import './TrashPage.css';
import Icon from '../components/UI/Icon';

const listOf = (response) => response?.data || response || [];

const TrashPage = () => {
  const navigate = useNavigate();
  const [scope, setScope] = useState('public');
  const [publicTrash, setPublicTrash] = useState([]);
  const [privateTrash, setPrivateTrash] = useState([]);
  const [privatePassword, setPrivatePassword] = useState('');
  const [privateToken, setPrivateToken] = useState('');
  const [privateReady, setPrivateReady] = useState(false);
  const [firstTime, setFirstTime] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => setToast({ show: true, message, type });

  const lockPrivateTrash = () => {
    setPrivatePassword('');
    setPrivateToken('');
    setPrivateTrash([]);
    setPrivateReady(false);
  };

  useEffect(() => {
    let active = true;
    noteService.getTrash()
      .then((response) => { if (active) setPublicTrash(listOf(response)); })
      .catch((loadError) => { if (active) setError(loadError.response?.data?.message || 'Không tải được thùng rác.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const loadPrivateTrash = async (password, accessToken = privateToken) => {
    setLoading(true);
    try {
      const encryptedItems = listOf(await noteService.getPrivateTrash(accessToken));
      const decryptedItems = await Promise.all(encryptedItems.map(async (note) => ({
        ...note,
        isPrivate: true,
        title: await decryptText(note.title, password),
        content: await decryptText(note.content, password),
        ...(note.metadata ? JSON.parse(await decryptText(note.metadata, password)) : {}),
      })));
      setPrivateTrash(decryptedItems);
      setPrivateReady(true);
      setError('');
    } catch (loadError) {
      if (isPrivateLockedError(loadError)) lockPrivateTrash();
      setError(loadError.response?.data?.message || 'Không thể giải mã thùng rác riêng tư.');
      setPrivateReady(false);
    } finally {
      setLoading(false);
    }
  };

  const selectScope = async (nextScope) => {
    setScope(nextScope);
    setError('');
    if (nextScope === 'public') {
      lockPrivateTrash();
      return;
    }
    if (privateReady && privatePassword) return;
    setPrivateReady(false);
    setPrivateTrash([]);
    try {
      const status = await authService.checkPrivatePasswordStatus();
      const hasSetup = status?.hasSetup ?? status?.data?.hasSetup ?? false;
      setFirstTime(!hasSetup);
      setAuthOpen(true);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Không kiểm tra được trạng thái bảo mật riêng tư.');
    }
  };

  const handlePrivateAuth = (password, accessToken) => {
    setPrivatePassword(password);
    setPrivateToken(accessToken);
    setFirstTime(false);
    setAuthOpen(false);
    loadPrivateTrash(password, accessToken);
  };

  const handleRestore = async (note) => {
    try {
      if (scope === 'private') {
        await noteService.restorePrivateTrashNote(note.id, privateToken);
        setPrivateTrash((current) => current.filter((item) => item.id !== note.id));
      } else {
        await noteService.restoreTrashNote(note.id);
        setPublicTrash((current) => current.filter((item) => item.id !== note.id));
        window.dispatchEvent(new Event('nep:notes-changed'));
      }
      showToast('Đã khôi phục ghi chú.', 'success');
    } catch (actionError) {
      if (isPrivateLockedError(actionError)) lockPrivateTrash();
      showToast(actionError.response?.data?.message || 'Không thể khôi phục ghi chú.', 'error');
    }
  };

  const handlePermanentDelete = async (note) => {
    if (!window.confirm('Xóa vĩnh viễn ghi chú này? Thao tác này không thể hoàn tác.')) return;
    try {
      if (scope === 'private') {
        await noteService.permanentlyDeletePrivateTrashNote(note.id, privateToken);
        setPrivateTrash((current) => current.filter((item) => item.id !== note.id));
      } else {
        await noteService.permanentlyDeleteTrashNote(note.id);
        setPublicTrash((current) => current.filter((item) => item.id !== note.id));
      }
      showToast('Đã xóa ghi chú vĩnh viễn.', 'success');
    } catch (actionError) {
      if (isPrivateLockedError(actionError)) lockPrivateTrash();
      showToast(actionError.response?.data?.message || 'Không thể xóa ghi chú.', 'error');
    }
  };

  const handleAuthClose = () => {
    setAuthOpen(false);
    setScope('public');
  };
  const activeItems = scope === 'private' ? privateTrash : publicTrash;

  return (
    <div className="trash-page">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, show: false }))} />}
      <PrivateAuthModal isOpen={authOpen} isFirstTime={firstTime} onClose={handleAuthClose} onSuccess={handlePrivateAuth} />
      <header className="trash-heading">
        <div><span className="trash-eyebrow">QUẢN LÝ ĐÃ XÓA</span><h2>Thùng rác</h2><p>Ghi chú đã xóa được tách riêng theo từng vùng dữ liệu.</p></div>
        <button type="button" className="trash-back-button" onClick={() => navigate('/dashboard')}><Icon name="chevron-left" size={17} /> Quay lại ghi chú</button>
      </header>

      <div className="trash-scope-tabs" role="tablist" aria-label="Phân loại thùng rác">
        <button type="button" role="tab" aria-selected={scope === 'public'} className={scope === 'public' ? 'active' : ''} onClick={() => selectScope('public')}>Ghi chú thường <span>{publicTrash.length}</span></button>
        <button type="button" role="tab" aria-selected={scope === 'private'} className={scope === 'private' ? 'active' : ''} onClick={() => selectScope('private')}><Icon name="lock" size={16} /> Ghi chú riêng tư {privateReady && <span>{privateTrash.length}</span>}</button>
      </div>

      {scope === 'private' && <div className="trash-private-banner"><Icon name="shield" size={21} /><div><strong>Thùng rác riêng tư được tách biệt</strong><p>Nội dung vẫn được mã hóa và chỉ giải mã sau khi xác thực mật khẩu riêng tư.</p></div>{privateReady && <button type="button" onClick={() => { lockPrivateTrash(); setScope('public'); }}>Khóa</button>}</div>}
      {error && <div className="trash-error" role="alert">{error}</div>}
      {loading ? <div className="trash-empty">Đang tải thùng rác…</div> : scope === 'private' && !privateReady ? (
        <div className="trash-empty"><Icon name="lock" size={32} /><strong>Thùng rác riêng tư đang khóa</strong><p>Nhập mật khẩu riêng tư để xem và khôi phục ghi chú.</p><button type="button" onClick={() => selectScope('private')}>Mở khóa</button></div>
      ) : activeItems.length ? (
        <div className="trash-list">
          {activeItems.map((note) => (
            <article className="trash-note" key={`${scope}-${note.id}`}>
              <div className="trash-note-copy"><div className="trash-note-title-row"><h3>{note.title || 'Ghi chú không có tiêu đề'}</h3><span className={scope === 'private' ? 'trash-private-tag' : 'trash-public-tag'}>{scope === 'private' ? 'Riêng tư' : 'Thường'}</span></div><p>{(note.content || 'Chưa có nội dung').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)}</p><small>Đã xóa: {note.deletedAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(note.deletedAt)) : '—'}{scope === 'public' && note.originalTopicSlug ? ` · Bộ sưu tập: ${note.originalTopicSlug}` : ''}</small></div>
              <div className="trash-note-actions"><button type="button" className="trash-restore" onClick={() => handleRestore(note)}>Khôi phục</button><button type="button" className="trash-delete" onClick={() => handlePermanentDelete(note)}>Xóa vĩnh viễn</button></div>
            </article>
          ))}
        </div>
      ) : <div className="trash-empty"><Icon name="trash" size={32} /><strong>Thùng rác đang trống</strong><p>{scope === 'private' ? 'Ghi chú riêng tư đã xóa sẽ chỉ xuất hiện ở khu vực này.' : 'Ghi chú thường đã xóa sẽ xuất hiện ở khu vực này.'}</p></div>}
    </div>
  );
};

export default TrashPage;
