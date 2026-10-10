import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import { formatReminder, isReminderDue, isReminderToday } from '../../utils/noteReminders';
import Icon from '../UI/Icon';
import './ReminderCenter.css';

const currentPermission = () => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;

export default function ReminderCenter() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState(currentPermission);
  const [error, setError] = useState('');
  const [permissionMessage, setPermissionMessage] = useState('');
  const mounted = useRef(false);
  const refreshId = useRef(0);
  const delivering = useRef(new Set());
  const centerRef = useRef(null);
  const refresh = useCallback(async () => {
    const requestId = ++refreshId.current;
    try {
      const items = await noteService.getReminders();
      if (mounted.current && requestId === refreshId.current) {
        setReminders(items);
        setAlerts((current) => current.filter((alert) => items.some((item) => item.id === alert.id && item.reminderAt === alert.reminderAt)));
        setError('');
      }
    } catch {
      if (mounted.current && requestId === refreshId.current) setError('Chưa tải được lịch nhắc. Ứng dụng sẽ thử lại khi có kết nối.');
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const resume = () => { setPermission(currentPermission()); refresh(); };
    const initialRefresh = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('nep:reminders-changed', refresh);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      mounted.current = false;
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener('nep:reminders-changed', refresh);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [refresh]);

  const openNote = useCallback((note) => {
    setAlerts((current) => current.filter((item) => item.id !== note.id));
    setOpen(false);
    navigate(`${note.isPrivate ? '/private-notes' : '/dashboard'}?open=${encodeURIComponent(note.id)}`);
  }, [navigate]);

  useEffect(() => {
    const pending = reminders.filter((item) => item.reminderAt && !item.reminderNotifiedAt && Number.isFinite(new Date(item.reminderAt).getTime()));
    if (!pending.length) return;
    const earliest = Math.min(...pending.map((item) => new Date(item.reminderAt).getTime()));
    const timer = window.setTimeout(async () => {
      for (const item of pending.filter((reminder) => isReminderDue(reminder))) {
        const key = `${item.id}:${item.reminderAt}`;
        if (delivering.current.has(key)) continue;
        delivering.current.add(key);
        try {
          const result = await noteService.deliverReminder(item.id, item.reminderAt);
          if (!mounted.current) return;
          if (!result.delivered) { await refresh(); continue; }
          const reminder = result.reminder;
          setReminders((current) => current.map((note) => note.id === reminder.id && note.reminderAt === reminder.reminderAt ? reminder : note));
          setAlerts((current) => [...current.filter((note) => note.id !== reminder.id), reminder]);
          setOpen(true);
          if (currentPermission() === 'granted') {
            // Some mobile browsers cannot construct Notification; the panel
            // above always remains available even if the system notification fails.
            try {
              const notification = new Notification('Việc cần làm hôm nay', {
                body: `${reminder.title}\n${formatReminder(reminder.reminderAt)}`,
                tag: key,
              });
              notification.onclick = () => { window.focus(); openNote(reminder); notification.close(); };
            } catch { /* Keep the in-app reminder visible. */ }
          }
        } catch {
          if (mounted.current) setError('Chưa thể gửi lời nhắc. Ứng dụng sẽ tự thử lại.');
        } finally { delivering.current.delete(key); }
      }
    }, Math.min(60_000, Math.max(250, earliest - Date.now())));
    return () => window.clearTimeout(timer);
  }, [reminders, refresh, openNote]);

  useEffect(() => {
    if (!open) return;
    const clickOutside = (event) => {
      if (!alerts.length && !centerRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', clickOutside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', clickOutside); document.removeEventListener('keydown', escape); };
  }, [open, alerts.length]);

  const requestPermission = async () => {
    if (permission === 'unsupported') return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setPermissionMessage(result === 'granted' ? 'Đã bật thông báo trên máy tính.' : 'Bạn vẫn nhận được lời nhắc trong ứng dụng. Có thể bật thông báo ở cài đặt trình duyệt.');
    } catch { setPermissionMessage('Trình duyệt chưa hỗ trợ thông báo máy tính tại đây. Lời nhắc trong ứng dụng vẫn hoạt động.'); }
  };
  const today = reminders.filter((item) => isReminderToday(item.reminderAt)).sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));
  const upcoming = reminders.filter((item) => !isReminderToday(item.reminderAt) && !item.reminderNotifiedAt && !isReminderDue(item))
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt)).slice(0, 3);
  const badge = alerts.length || today.filter((item) => !item.reminderNotifiedAt).length;
  const renderReminder = (item) => <div className="reminder-list-item" key={item.id}>
    <Icon name={item.isPrivate ? 'lock' : 'bell'} size={17} />
    <button type="button" onClick={() => openNote(item)}><strong>{item.title}</strong><span>{formatReminder(item.reminderAt)}</span></button>
    <small>{item.reminderNotifiedAt ? 'Đã nhắc' : isReminderDue(item) ? 'Đến giờ' : 'Sắp đến'}</small>
  </div>;

  return <div className="reminder-center" ref={centerRef}>
    <button className="reminder-toggle" type="button" aria-label="Lịch nhắc ghi chú" title="Việc cần làm hôm nay" aria-expanded={open} onClick={() => setOpen((value) => !value)}><Icon name="bell" size={20} />{badge > 0 && <span className="reminder-badge">{badge}</span>}</button>
    {open && <section className="reminder-panel" role="dialog" aria-label="Việc cần làm hôm nay">
      <header><div><h2>Việc cần làm hôm nay</h2><p>{new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date())}</p></div><button type="button" aria-label="Đóng lịch nhắc" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button></header>
      {error && <p className="reminder-error" role="alert">{error}</p>}
      {!!alerts.length && <div className="reminder-due-list" role="alert"><h3>Đã đến giờ nhắc</h3>{alerts.map((item) => <article className="reminder-due-item" key={item.id}><strong>{item.title}</strong><span>{formatReminder(item.reminderAt)}</span><div><button type="button" onClick={() => openNote(item)}>Mở ghi chú</button><button type="button" onClick={() => setAlerts((current) => current.filter((note) => note.id !== item.id))}>Đã xem</button></div></article>)}</div>}
      <div className="reminder-today-list">{today.length ? today.map(renderReminder) : <p className="reminder-empty">Hôm nay chưa có việc được hẹn nhắc.</p>}</div>
      {!!upcoming.length && <div className="reminder-upcoming"><h3>Tiếp theo</h3>{upcoming.map(renderReminder)}</div>}
      <footer>
        {permission === 'granted' ? <span><Icon name="check" size={14} /> Đã bật thông báo máy tính</span>
          : permission === 'unsupported' ? <span>Lời nhắc sẽ hiện trong ứng dụng.</span>
            : <button type="button" onClick={requestPermission}><Icon name="bell" size={15} /> Bật thông báo máy tính</button>}
        {permissionMessage && <p role="status">{permissionMessage}</p>}
        <p>Giữ ứng dụng mở để được nhắc đúng giờ. Khi mở lại, các việc quá giờ chưa nhắc sẽ hiện lên.</p>
      </footer>
    </section>}
  </div>;
}
