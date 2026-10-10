import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import { AppContext } from '../../context/AppContextBase';
import TopicModal from '../Notes/TopicModal';
import Toast from '../UI/Toast';
import Icon from '../UI/Icon';
import Brand from './Brand';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AppContext);
  const { preferences, updatePreferences } = useContext(AppContext);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  useEffect(() => {
    let isCurrent = true;
    const fetchTopics = async () => {
      if (!user) return;
      setLoadingTopics(true);
      try {
        const response = await noteService.getTopics();
        if (isCurrent) setTopics(response.data || response || []);
      } catch (error) {
        console.error('Không tải được bộ sưu tập ghi chú:', error);
      } finally {
        if (isCurrent) setLoadingTopics(false);
      }
    };
    fetchTopics();
    return () => { isCurrent = false; };
  }, [user]);

  const viewLink = (view, icon, label) => {
    const target = view === 'all' ? '/dashboard' : '/dashboard?view=' + view;
    const selectedView = new URLSearchParams(location.search).get('view') || 'all';
    const active = location.pathname === '/dashboard' && selectedView === view;
    return (
      <Link key={view} to={target} className={'nav-item' + (active ? ' active' : '')} aria-current={active ? 'page' : undefined} onClick={onClose}>
        <Icon name={icon} className="nav-icon" />
        <span className="nav-label">{label}</span>
      </Link>
    );
  };

  const handleThemeToggle = async () => {
    if (savingTheme) return;
    setSavingTheme(true);
    try {
      await updatePreferences({ theme: preferences?.theme === 'dark' ? 'light' : 'dark' });
    } catch (error) {
      setToast({
        show: true,
        message: error.response?.data?.message || 'Không thể lưu giao diện lên máy chủ. Vui lòng thử lại.',
        type: 'error',
      });
    } finally {
      setSavingTheme(false);
    }
  };

  const handleTopicChanged = async ({ action, topicId, nextTopicId } = {}) => {
    const currentTopicPath = topicId ? `/notes/${topicId}` : '';
    let navigatedToChangedTopic = false;
    if (location.pathname === currentTopicPath) {
      if (action === 'delete') {
        navigate('/dashboard', { replace: true });
        navigatedToChangedTopic = true;
      }
      if (action === 'rename' && nextTopicId) {
        navigate(`/notes/${nextTopicId}`, { replace: true });
        navigatedToChangedTopic = true;
      }
    }
    try {
      const response = await noteService.getTopics();
      setTopics(response.data || response || []);
    } catch (error) {
      console.error('Không làm mới được bộ sưu tập:', error);
    }
    if (!navigatedToChangedTopic) window.dispatchEvent(new Event('nep:notes-changed'));
  };

  return (
    <>
      <aside className={'sidebar-container' + (isOpen ? ' open' : '')}>
        <div className="sidebar-header">
          <Brand to="/dashboard" onClick={onClose} />
          <button className="mobile-close-btn" onClick={onClose} aria-label="Đóng menu"><Icon name="close" /></button>
        </div>

        <NavLink to="/dashboard?new=1" className="sidebar-new-note" onClick={onClose}>
          <Icon name="plus" /> Ghi chú mới
        </NavLink>

        <nav className="sidebar-nav" aria-label="Điều hướng sổ tay">
          <>
              <div className="nav-section">
                <span className="section-title">Không gian</span>
                <NavLink to="/calendar" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} onClick={onClose}>
                  <Icon name="calendar" className="nav-icon" /><span className="nav-label">Lịch ghi chú</span>
                </NavLink>
                {viewLink('all', 'files', 'Tất cả ghi chú')}
                {viewLink('today', 'today', 'Hôm nay')}
                {viewLink('favorites', 'star', 'Yêu thích')}
                {viewLink('pinned', 'pin', 'Đã ghim')}
              </div>

              <div className="nav-section">
                <div className="section-header">
                  <span className="section-title">Bộ sưu tập</span>
                  <button
                    className="add-topic-btn"
                    onClick={() => { setEditingTopic(null); setIsTopicModalOpen(true); }}
                    title="Tạo bộ sưu tập mới"
                    aria-label="Tạo bộ sưu tập mới"
                  ><Icon name="plus" size={17} /></button>
                </div>
                {loadingTopics ? (
                  <div className="sidebar-loading">Đang tải…</div>
                ) : topics.length ? (
                  <div className="topic-list">
                    {topics.map((topic) => (
                      <div className="topic-nav-row" key={topic.id || topic.slug}>
                        <NavLink to={'/notes/' + (topic.slug || topic.id)} className={({ isActive }) => 'nav-item topic-item' + (isActive ? ' active' : '')} onClick={onClose}>
                          <Icon name="folder" className="nav-icon" />
                          <span className="nav-label">{topic.name || topic.title}</span>
                        </NavLink>
                        <button className="topic-manage-btn" title="Đổi tên hoặc xóa chủ đề" aria-label={'Quản lý ' + topic.name} onClick={() => { setEditingTopic(topic); setIsTopicModalOpen(true); }}><Icon name="more" size={17} /></button>
                      </div>
                    ))}
                  </div>
                ) : <span className="empty-topics">Chưa có bộ sưu tập</span>}
              </div>

              <div className="nav-section">
                <NavLink to="/private-notes" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} onClick={onClose}>
                  <Icon name="lock" className="nav-icon" /><span className="nav-label">Ghi chú riêng tư</span>
                </NavLink>
                <NavLink to="/trash" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')} onClick={onClose}>
                  <Icon name="trash" className="nav-icon" /><span className="nav-label">Thùng rác</span>
                </NavLink>
              </div>
          </>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/settings" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")} onClick={onClose}><Icon name="settings" className="nav-icon" /><span className="nav-label">Cài đặt</span></NavLink>
          <button
            className="theme-toggle"
            type="button"
            onClick={handleThemeToggle}
            disabled={savingTheme}
            aria-busy={savingTheme}
            aria-label={preferences?.theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
          >
            <Icon name={preferences?.theme === 'dark' ? 'sun' : 'moon'} className="nav-icon" />
            <span className="nav-label">{preferences?.theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}</span>
          </button>
          <Link to="/settings?tab=profile" className="sidebar-account" onClick={onClose} aria-label="Chỉnh sửa hồ sơ">
            <div className="account-avatar">{user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : (user?.displayName || user?.username || 'N').slice(0, 1).toLocaleUpperCase('vi')}</div>
            <div className="account-copy">
              <strong>{user?.displayName || user?.username || 'Sổ tay cá nhân'}</strong>
              <span>{user?.email || 'Sổ tay cá nhân'}</span>
            </div>
          </Link>
        </div>
      </aside>

      {isTopicModalOpen && (
        <TopicModal
          isOpen={isTopicModalOpen}
          onClose={() => { setIsTopicModalOpen(false); setEditingTopic(null); }}
          onSuccess={handleTopicChanged}
          topicToEdit={editingTopic}
        />
      )}
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast((current) => ({ ...current, show: false }))} />}
    </>
  );
};

export default Sidebar;
