import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContextBase';
import userService from '../services/userService';
import authService from '../services/authService';
import noteService from '../services/noteService';
import { decryptText, encryptText } from '../utils/crypto';
import Toast from '../components/UI/Toast';
import './SettingsPage.css';
import { useSearchParams } from 'react-router-dom';
import Icon from '../components/UI/Icon';
import PasswordInput from '../components/Public/PasswordInput';

const COLOR_PALETTE = [
  { name: 'Xanh HKT', hex: '#2463eb' },
  { name: 'Cam', hex: '#ea580c' },
  { name: 'Xanh ngọc', hex: '#0f766e' },
  { name: 'Tím', hex: '#7c3aed' },
  { name: 'Hồng', hex: '#be185d' },
  { name: 'Xám', hex: '#475569' },
];
const UI_DEFAULTS = { theme: 'light', primaryColor: '#2463eb', noteLayout: 'table', noteSort: 'newest', density: 'comfortable' };

const SettingsPage = () => {
  const { user, preferences, updatePreferences, updateUserProfile } = useContext(AppContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = ['profile', 'appearance', 'security'].includes(searchParams.get('tab')) ? searchParams.get('tab') : 'profile';
  const avatarInputRef = useRef(null);
  const avatarReaderRef = useRef(null);
  const [readingAvatar, setReadingAvatar] = useState(false);
  const [loadingUI, setLoadingUI] = useState(false);
  const [checkingPrivateStatus, setCheckingPrivateStatus] = useState(true);
  const [privateStatusError, setPrivateStatusError] = useState('');
  const [statusReload, setStatusReload] = useState(0);
  const [noteLayout, setNoteLayout] = useState(() => preferences?.noteLayout || 'table');
  const [noteSort, setNoteSort] = useState(() => preferences?.noteSort || 'newest');
  const [density, setDensity] = useState(() => preferences?.density || 'comfortable');

  // States thông tin cá nhân & UI
  const [displayName, setDisplayName] = useState(() => user?.displayName || '');
  const [email, setEmail] = useState(() => user?.email || '');
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => user?.avatarDataUrl || '');
  const [theme, setTheme] = useState(() => preferences?.theme || 'light');
  const [primaryColor, setPrimaryColor] = useState(() => preferences?.primaryColor || '#2463eb');

  // States mật khẩu tài khoản
  const [currentAccountPassword, setCurrentAccountPassword] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');

  // States mật khẩu riêng tư
  const [hasPrivateSetup, setHasPrivateSetup] = useState(false);
  const [currentPrivatePassword, setCurrentPrivatePassword] = useState('');
  const [newPrivatePassword, setNewPrivatePassword] = useState('');
  const [confirmPrivatePassword, setConfirmPrivatePassword] = useState('');

  // Trạng thái Loading & Toast
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingAccountPassword, setLoadingAccountPassword] = useState(false);
  const [loadingPrivatePassword, setLoadingPrivatePassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [previousUser, setPreviousUser] = useState(user);
  if (previousUser !== user) {
    if (previousUser?.id !== user?.id) { setCheckingPrivateStatus(true); setPrivateStatusError(''); }
    setPreviousUser(user);
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setAvatarDataUrl(user?.avatarDataUrl || '');
  }
  const [previousPreferences, setPreviousPreferences] = useState(preferences);
  if (previousPreferences !== preferences) {
    setPreviousPreferences(preferences);
    if (!loadingUI) {
      setTheme(preferences?.theme || 'light');
      setPrimaryColor(preferences?.primaryColor || '#2463eb');
      setNoteLayout(preferences?.noteLayout || 'table');
      setNoteSort(preferences?.noteSort || 'newest');
      setDensity(preferences?.density || 'comfortable');
    }
  }

  useEffect(() => {
    let active = true;
    authService.checkPrivatePasswordStatus().then((response) => {
      if (active) setHasPrivateSetup(response.data?.hasSetup ?? response?.hasSetup ?? false);
    }).catch(() => {
      if (active) setPrivateStatusError('Không tải được trạng thái vùng riêng tư. Vui lòng thử lại.');
    }).finally(() => { if (active) setCheckingPrivateStatus(false); });
    return () => { active = false; };
  }, [user?.id, statusReload]);

  useEffect(() => () => { avatarReaderRef.current?.abort(); avatarReaderRef.current = null; }, []);

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  const profileChanged = displayName.trim() !== (user?.displayName || '') || email.trim() !== (user?.email || '') || avatarDataUrl !== (user?.avatarDataUrl || '');
  const selectedUI = { theme, primaryColor, noteLayout, noteSort, density };
  const uiChanged = Object.entries(selectedUI).some(([key, value]) => value !== (preferences?.[key] || UI_DEFAULTS[key]));

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (loadingProfile || readingAvatar || !profileChanged) return;
    if (!displayName.trim()) { showToast('Vui lòng nhập tên hiển thị.', 'warning'); return; }
    setLoadingProfile(true);
    try {
      const saved = await userService.updateProfile({ displayName: displayName.trim(), email: email.trim(), avatarDataUrl });
      updateUserProfile(saved.user);
      showToast('Đã cập nhật hồ sơ.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.', 'error');
    } finally { setLoadingProfile(false); }
  };

  const handleSaveUI = async (event) => {
    event.preventDefault();
    if (loadingUI || !uiChanged) return;
    setLoadingUI(true);
    try {
      await updatePreferences(selectedUI);
      showToast('Đã lưu giao diện và cách hiển thị ghi chú.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Không thể lưu giao diện. Vui lòng thử lại.', 'error');
    } finally { setLoadingUI(false); }
  };

  const resetUI = () => {
    setTheme(UI_DEFAULTS.theme); setPrimaryColor(UI_DEFAULTS.primaryColor);
    setNoteLayout(UI_DEFAULTS.noteLayout); setNoteSort(UI_DEFAULTS.noteSort); setDensity(UI_DEFAULTS.density);
  };

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { showToast('Chọn ảnh PNG, JPG hoặc WebP.', 'warning'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Ảnh đại diện cần nhỏ hơn 2 MB.', 'warning'); return; }
    avatarReaderRef.current?.abort();
    setReadingAvatar(true);
    const reader = new FileReader();
    avatarReaderRef.current = reader;
    reader.onload = async () => {
      try {
        const image = new Image();
        image.src = reader.result;
        await image.decode();
        if (avatarReaderRef.current === reader) setAvatarDataUrl(reader.result);
      } catch { if (avatarReaderRef.current === reader) showToast('Không đọc được ảnh. Vui lòng chọn ảnh khác.', 'error'); }
      finally { if (avatarReaderRef.current === reader) setReadingAvatar(false); }
    };
    reader.onerror = () => { setReadingAvatar(false); showToast('Không thể đọc ảnh. Vui lòng thử lại.', 'error'); };
    reader.readAsDataURL(file);
  };

  // 2. Cập nhật Mật khẩu Đăng nhập Tài khoản
  const handleChangeAccountPassword = async (e) => {
    e.preventDefault();
    if (loadingAccountPassword) return;

    if (!currentAccountPassword) {
      showToast('Vui lòng nhập mật khẩu tài khoản hiện tại.', 'warning');
      return;
    }
    if (newAccountPassword.length < 6 || new TextEncoder().encode(newAccountPassword).length > 72) {
      showToast('Mật khẩu mới cần từ 6 ký tự và tối đa 72 byte.', 'warning');
      return;
    }
    if (newAccountPassword !== confirmAccountPassword) {
      showToast('Mật khẩu xác nhận không trùng khớp.', 'warning');
      return;
    }

    setLoadingAccountPassword(true);

    try {
      await authService.changeAccountPassword({
        currentPassword: currentAccountPassword,
        newPassword: newAccountPassword,
      });

      showToast('Đã đổi mật khẩu tài khoản thành công!', 'success');
      setCurrentAccountPassword('');
      setNewAccountPassword('');
      setConfirmAccountPassword('');
    } catch (error) {
      showToast(error.response?.data?.message || 'Lỗi khi đổi mật khẩu tài khoản.', 'error');
    } finally {
      setLoadingAccountPassword(false);
    }
  };

  // 3. Cài đặt / Đổi Mật khẩu Vùng Riêng Tư
  const handleSavePrivatePassword = async (e) => {
    e.preventDefault();
    if (loadingPrivatePassword || checkingPrivateStatus || privateStatusError) return;

    if (hasPrivateSetup && !currentPrivatePassword) {
      showToast('Vui lòng nhập mật khẩu riêng tư hiện tại.', 'warning');
      return;
    }
    if (newPrivatePassword.length < 6 || new TextEncoder().encode(newPrivatePassword).length > 72) {
      showToast('Mật khẩu riêng tư mới cần từ 6 ký tự và tối đa 72 byte.', 'warning');
      return;
    }
    if (newPrivatePassword !== confirmPrivatePassword) {
      showToast('Mật khẩu riêng tư xác nhận không khớp.', 'warning');
      return;
    }

    setLoadingPrivatePassword(true);

    try {
      if (hasPrivateSetup) {
        const privateAccess = await authService.verifyPrivatePassword(currentPrivatePassword);
        if (privateAccess?.success !== true || !privateAccess.privateToken) {
          throw new Error('Mật khẩu riêng tư hiện tại không đúng.');
        }

        const noteResponse = await noteService.getPrivateNotes(privateAccess.privateToken);
        const encryptedNotes = noteResponse.data || noteResponse || [];
        const readOldValue = async (value) => {
          if (value === '') return '';
          if (typeof value !== 'string') throw new Error('Có ghi chú riêng tư chưa được lưu đúng định dạng. Mật khẩu chưa được đổi.');
          if (value.startsWith('ENC_')) return decryptText(value, currentPrivatePassword);
          let payload;
          try { payload = JSON.parse(atob(value)); } catch { return value; }
          if (payload && typeof payload.iv === 'string' && typeof payload.ciphertext === 'string') {
            return decryptText(value, currentPrivatePassword);
          }
          return value;
        };
        const reencryptNote = async (note) => {
          const [plainTitle, plainContent] = await Promise.all([
            readOldValue(note.title),
            readOldValue(note.content),
          ]);
          const plainMetadata = note.metadata ? await readOldValue(note.metadata) : JSON.stringify({
            noteDate: new Date(note.createdAt || Date.now()).toLocaleDateString('sv-SE'),
            attachments: [],
            backgroundColor: '#fffdf8',
            backgroundImage: '',
          });
          const [title, content] = await Promise.all([
            encryptText(plainTitle, newPrivatePassword),
            encryptText(plainContent, newPrivatePassword),
          ]);
          const metadata = await encryptText(plainMetadata, newPrivatePassword);
          return { id: note.id, title, content, metadata };
        };
        const encryptedTrashResponse = await noteService.getPrivateTrash(privateAccess.privateToken);
        const encryptedTrashNotes = encryptedTrashResponse.data || encryptedTrashResponse || [];
        const [reencryptedNotes, reencryptedTrashNotes] = await Promise.all([
          Promise.all(encryptedNotes.map(reencryptNote)),
          Promise.all(encryptedTrashNotes.map(reencryptNote)),
        ]);
        await authService.changePrivatePassword({
          currentPassword: currentPrivatePassword,
          newPassword: newPrivatePassword,
          encryptedNotes: reencryptedNotes,
          encryptedPrivateTrashNotes: reencryptedTrashNotes,
        });
        showToast('Đã đổi mật khẩu vùng riêng tư thành công!', 'success');
      } else {
        await authService.setupPrivatePassword(newPrivatePassword);
        showToast('Khởi tạo mật khẩu vùng riêng tư thành công!', 'success');
        setHasPrivateSetup(true);
      }

      setCurrentPrivatePassword('');
      setNewPrivatePassword('');
      setConfirmPrivatePassword('');
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Lỗi khi cập nhật mật khẩu riêng tư.', 'error');
    } finally {
      setLoadingPrivatePassword(false);
    }
  };

  return (
    <div className="settings-page-container">
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, show: false }))} />}
      <header className="settings-page-header"><p className="settings-eyebrow">KHÔNG GIAN CỦA BẠN</p><h2>Cài đặt</h2><p>Điều chỉnh HKT theo cách bạn ghi chú mỗi ngày.</p></header>
      <nav className="settings-tabs" aria-label="Các phần cài đặt">
        {[['profile', 'user', 'Hồ sơ'], ['appearance', 'palette', 'Giao diện'], ['security', 'shield', 'Bảo mật']].map(([tab, icon, label]) => <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setSearchParams({ tab }, { replace: true })}><Icon name={icon} size={18} />{label}</button>)}
      </nav>

      {activeTab === 'profile' && <section className="settings-card" aria-labelledby="profile-heading">
        <div className="card-header"><h3 id="profile-heading">Hồ sơ cá nhân</h3><p>Tên và ảnh đại diện xuất hiện trong không gian ghi chú của bạn.</p></div>
        <form className="card-body" onSubmit={handleSaveProfile}>
          <fieldset disabled={loadingProfile}>
            <div className="profile-avatar-editor">
              {avatarDataUrl ? <img src={avatarDataUrl} alt="Ảnh đại diện hiện tại" /> : <span className="profile-avatar-placeholder">{(displayName || user?.username || 'H').slice(0, 1).toLocaleUpperCase('vi')}</span>}
              <div className="avatar-edit-copy"><strong>Ảnh đại diện</strong><small>PNG, JPG hoặc WebP · tối đa 2 MB</small><div className="avatar-edit-actions"><button type="button" className="settings-outline-button" disabled={readingAvatar} onClick={() => avatarInputRef.current?.click()}><Icon name="upload" size={16} />{readingAvatar ? 'Đang đọc ảnh…' : 'Chọn ảnh'}</button>{avatarDataUrl && <button type="button" className="settings-text-button" disabled={readingAvatar} onClick={() => setAvatarDataUrl('')}>Gỡ ảnh</button>}</div></div>
              <input id="settings-avatar" ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={chooseAvatar} />
            </div>
            <div className="settings-form-grid">
              <div className="form-group"><label htmlFor="settings-display-name">Tên hiển thị</label><input id="settings-display-name" value={displayName} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên của bạn" autoComplete="name" required /><small className="field-hint">Tối đa 80 ký tự.</small></div>
              <div className="form-group"><label htmlFor="settings-username">Tên đăng nhập</label><input id="settings-username" value={user?.username || ''} readOnly className="input-disabled" /><small className="field-hint">Tên đăng nhập được giữ nguyên.</small></div>
              <div className="form-group settings-full-width"><label htmlFor="settings-email">Email</label><input id="settings-email" type="email" value={email} maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" autoComplete="email" /><small className="field-hint">Bạn có thể để trống email.</small></div>
            </div>
            {user?.createdAt && <p className="profile-member-date">Tham gia từ {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(new Date(user.createdAt))}</p>}
            <div className="settings-form-footer"><span>{profileChanged ? 'Có thay đổi chưa lưu' : 'Hồ sơ đã được cập nhật'}</span><button type="submit" className="settings-primary-button" disabled={loadingProfile || readingAvatar || !profileChanged}><Icon name="check" size={17} />{loadingProfile ? 'Đang lưu…' : 'Lưu hồ sơ'}</button></div>
          </fieldset>
        </form>
      </section>}

      {activeTab === 'appearance' && <section className="settings-card" aria-labelledby="appearance-heading">
        <div className="card-header"><h3 id="appearance-heading">Giao diện và hiển thị</h3><p>Tùy chọn được lưu cùng tài khoản để dùng lại khi đăng nhập.</p></div>
        <form className="card-body" onSubmit={handleSaveUI}><fieldset disabled={loadingUI}>
          <div className="settings-appearance-grid"><div className="appearance-controls">
            <div className="form-group"><label>Chế độ giao diện</label><div className="theme-toggle-group" role="group" aria-label="Chế độ giao diện"><button type="button" className={`theme-btn ${theme === 'light' ? 'active' : ''}`} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Icon name="sun" size={18} />Sáng</button><button type="button" className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Icon name="moon" size={18} />Tối</button></div></div>
            <div className="form-group"><label htmlFor="settings-primary-color">Màu chủ đạo</label><div className="color-picker-row"><div className="color-swatches">{COLOR_PALETTE.map((item) => <button key={item.hex} type="button" className={`swatch-btn ${primaryColor.toLowerCase() === item.hex ? 'selected' : ''}`} style={{ backgroundColor: item.hex }} onClick={() => setPrimaryColor(item.hex)} title={item.name} aria-label={item.name} aria-pressed={primaryColor.toLowerCase() === item.hex}>{primaryColor.toLowerCase() === item.hex && <Icon name="check" size={17} />}</button>)}</div><input id="settings-primary-color" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} aria-label="Màu chủ đạo tùy chỉnh" /></div></div>
            <div className="form-group"><label>Bố cục ghi chú mặc định</label><div className="theme-toggle-group" role="group" aria-label="Bố cục ghi chú mặc định"><button type="button" className={`theme-btn ${noteLayout === 'table' ? 'active' : ''}`} aria-pressed={noteLayout === 'table'} onClick={() => setNoteLayout('table')}><Icon name="table" size={18} />Bảng</button><button type="button" className={`theme-btn ${noteLayout === 'grid' ? 'active' : ''}`} aria-pressed={noteLayout === 'grid'} onClick={() => setNoteLayout('grid')}><Icon name="grid" size={18} />Lưới</button></div></div>
            <div className="form-group"><label htmlFor="settings-note-sort">Sắp xếp mặc định</label><select id="settings-note-sort" value={noteSort} onChange={(event) => setNoteSort(event.target.value)}><option value="newest">Mới cập nhật</option><option value="oldest">Cũ nhất</option><option value="title">Tên A–Z</option></select></div>
            <div className="form-group"><label>Khoảng cách hiển thị</label><div className="theme-toggle-group" role="group" aria-label="Khoảng cách hiển thị"><button type="button" className={`theme-btn ${density === 'comfortable' ? 'active' : ''}`} aria-pressed={density === 'comfortable'} onClick={() => setDensity('comfortable')}>Thoáng</button><button type="button" className={`theme-btn ${density === 'compact' ? 'active' : ''}`} aria-pressed={density === 'compact'} onClick={() => setDensity('compact')}>Gọn</button></div></div>
          </div><div className="appearance-preview-wrapper"><span>Xem trước</span><div className={`appearance-preview ${theme}`} style={{ '--preview-color': primaryColor }} aria-label="Xem trước giao diện"><div className="preview-sidebar"><b>HKT</b><i /><i className="selected" /><i /></div><div className="preview-notes"><strong>Ghi chú của bạn</strong><div className={`preview-note-items ${noteLayout} ${density}`}><span /><span /><span /><span /></div></div></div></div></div>
          <div className="settings-form-footer"><button type="button" className="settings-text-button" onClick={resetUI}><Icon name="reset" size={16} />Khôi phục mặc định</button><button type="submit" className="settings-primary-button" disabled={loadingUI || !uiChanged}><Icon name="check" size={17} />{loadingUI ? 'Đang lưu…' : 'Lưu giao diện'}</button></div>
        </fieldset></form>
      </section>}

      {activeTab === 'security' && <div className="settings-security-grid">
        <section className="settings-card" aria-labelledby="account-security-heading"><div className="card-header"><h3 id="account-security-heading">Mật khẩu đăng nhập</h3><p>Cập nhật mật khẩu dùng để đăng nhập tài khoản HKT.</p></div><form className="card-body" onSubmit={handleChangeAccountPassword}><fieldset disabled={loadingAccountPassword}>
          <div className="form-group"><label htmlFor="curr-acc-pass">Mật khẩu hiện tại</label><PasswordInput id="curr-acc-pass" label="mật khẩu hiện tại" value={currentAccountPassword} onChange={(event) => setCurrentAccountPassword(event.target.value)} autoComplete="current-password" required /></div>
          <div className="form-group"><label htmlFor="new-acc-pass">Mật khẩu mới</label><PasswordInput id="new-acc-pass" label="mật khẩu mới" value={newAccountPassword} onChange={(event) => setNewAccountPassword(event.target.value)} autoComplete="new-password" minLength={6} required /><small className="field-hint">Từ 6 ký tự, tối đa 72 byte.</small></div>
          <div className="form-group"><label htmlFor="conf-acc-pass">Xác nhận mật khẩu mới</label><PasswordInput id="conf-acc-pass" label="mật khẩu xác nhận" value={confirmAccountPassword} onChange={(event) => setConfirmAccountPassword(event.target.value)} autoComplete="new-password" required />{confirmAccountPassword && confirmAccountPassword !== newAccountPassword && <small className="field-error">Mật khẩu xác nhận chưa khớp.</small>}</div>
          <button type="submit" className="settings-primary-button" disabled={loadingAccountPassword}>{loadingAccountPassword ? 'Đang cập nhật…' : 'Đổi mật khẩu'}</button>
        </fieldset></form></section>
        <section className="settings-card" aria-labelledby="private-security-heading"><div className="card-header"><h3 id="private-security-heading">Vùng ghi chú riêng tư</h3><p>Mật khẩu riêng biệt để mã hóa và mở khóa ghi chú.</p></div><form className="card-body" onSubmit={handleSavePrivatePassword}>
          {privateStatusError && <div className="settings-status-error" role="alert"><p>{privateStatusError}</p><button type="button" className="settings-outline-button" onClick={() => { setCheckingPrivateStatus(true); setPrivateStatusError(''); setStatusReload((count) => count + 1); }}>Thử lại</button></div>}
          <fieldset disabled={loadingPrivatePassword || checkingPrivateStatus || Boolean(privateStatusError)}>
            <p className="card-desc">{checkingPrivateStatus ? 'Đang kiểm tra vùng riêng tư…' : hasPrivateSetup ? 'Đổi mật khẩu sẽ mã hóa lại ghi chú và thùng rác riêng tư.' : 'Tạo mật khẩu để bắt đầu sử dụng ghi chú riêng tư.'}</p>
            {hasPrivateSetup && <div className="form-group"><label htmlFor="current-private-pass">Mật khẩu riêng tư hiện tại</label><PasswordInput id="current-private-pass" label="mật khẩu riêng tư hiện tại" value={currentPrivatePassword} onChange={(event) => setCurrentPrivatePassword(event.target.value)} autoComplete="off" required /></div>}
            <div className="form-group"><label htmlFor="new-private-pass">{hasPrivateSetup ? 'Mật khẩu riêng tư mới' : 'Tạo mật khẩu riêng tư'}</label><PasswordInput id="new-private-pass" label="mật khẩu riêng tư mới" value={newPrivatePassword} onChange={(event) => setNewPrivatePassword(event.target.value)} autoComplete="off" minLength={6} required /><small className="field-hint">Từ 6 ký tự, tối đa 72 byte.</small></div>
            <div className="form-group"><label htmlFor="confirm-private-pass">Xác nhận mật khẩu riêng tư</label><PasswordInput id="confirm-private-pass" label="mật khẩu riêng tư xác nhận" value={confirmPrivatePassword} onChange={(event) => setConfirmPrivatePassword(event.target.value)} autoComplete="off" required />{confirmPrivatePassword && confirmPrivatePassword !== newPrivatePassword && <small className="field-error">Mật khẩu xác nhận chưa khớp.</small>}</div>
            <button type="submit" className="settings-primary-button" disabled={loadingPrivatePassword || checkingPrivateStatus || Boolean(privateStatusError)}>{loadingPrivatePassword ? 'Đang xử lý…' : hasPrivateSetup ? 'Đổi mật khẩu riêng tư' : 'Tạo mật khẩu riêng tư'}</button>
          </fieldset>
        </form></section>
        <p className="settings-session-note"><Icon name="check" size={17} />Phiên đăng nhập được giữ khi bạn đóng và mở lại trình duyệt.</p>
      </div>}
    </div>
  );
};

export default SettingsPage;
