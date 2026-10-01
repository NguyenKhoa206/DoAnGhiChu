import React, { useEffect, useMemo, useState } from 'react';
import noteService from '../services/noteService';
import DocumentDetailView from '../components/Notes/DocumentDetailView';
import { solarToVietnameseLunar } from '../utils/vietnameseLunar';
import { getNoteBackgroundStyle, hasCustomNoteBackground } from '../utils/noteAppearance';
import './CalendarPage.css';
import Icon from '../components/UI/Icon';

const keyOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const publicNotesOnly = (items) => (Array.isArray(items) ? items : []).filter((note) => !note.isPrivate && !note.private && !note.isEncrypted);
const CalendarPage = () => {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(keyOf(new Date()));
  const [notes, setNotes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const todayKey = keyOf(new Date());
  const isPastSelectedDate = selectedDate < todayKey;
  const reload = async () => {
    try {
      const [noteData, topicData] = await Promise.all([noteService.getAllNotes(), noteService.getTopics()]);
      setNotes(publicNotesOnly(noteData.data || noteData));
      setTopics(topicData.data || topicData || []);
      setError('');
    } catch { setError('Không tải được lịch ghi chú. Thử tải lại trang.'); }
  };
  useEffect(() => {
    let active = true;
    Promise.all([noteService.getAllNotes(), noteService.getTopics()])
      .then(([noteData, topicData]) => {
        if (!active) return;
        setNotes(publicNotesOnly(noteData.data || noteData));
        setTopics(topicData.data || topicData || []);
      })
      .catch(() => {
        if (active) setError('Không tải được lịch ghi chú. Thử tải lại trang.');
      });
    return () => { active = false; };
  }, []);
  const firstOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const byDate = useMemo(() => notes.reduce((map, note) => {
    const date = note.noteDate || (note.createdAt ? note.createdAt.slice(0, 10) : '');
    if (date) map[date] = [...(map[date] || []), note];
    return map;
  }, {}), [notes]);
  const selectedNotes = byDate[selectedDate] || [];
  const moveMonth = (offset) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  const save = async (data) => {
    if (data.noteDate && data.noteDate < todayKey) {
      const message = 'Không thể lưu ghi chú cho ngày đã qua.';
      setError(message);
      throw new Error(message);
    }
    const topicSlug = data.topicSlug || editing?.topicSlug || 'ghi-chu';
    const payload = { ...data, noteDate: data.noteDate || selectedDate, topicSlug };
    try {
      const response = payload.id
        ? await noteService.updateNote(payload.id, payload)
        : await noteService.createNote(payload);
      const savedNote = response.data || response;
      setNotes((current) => savedNote?.id
        ? (payload.id
          ? current.map((note) => note.id === payload.id ? { ...note, ...savedNote, topicSlug: savedNote.topicSlug || topicSlug } : note)
          : [{ ...savedNote, topicSlug: savedNote.topicSlug || topicSlug }, ...current.filter((note) => note.id !== savedNote.id)])
        : current);
      setError('');
      await reload();
      return savedNote;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể lưu ghi chú. Kiểm tra kết nối rồi thử lại.';
      setError(message);
      throw new Error(message);
    }
  };
  const selectedLunarDate = solarToVietnameseLunar(new Date(`${selectedDate}T12:00:00`));
  return <div className="calendar-page">
    {editorOpen ? <DocumentDetailView
      key={editing?.id || `new-${selectedDate}`}
      note={editing || { noteDate: selectedDate }}
      topics={topics}
      backLabel="Lịch ghi chú"
      readOnly={isPastSelectedDate}
      onBack={() => { setEditorOpen(false); setEditing(null); }}
      onSave={(noteId, changes) => save({ ...changes, id: noteId || undefined })}
    /> : <>
    <header className="calendar-heading">
      <div><p className="calendar-kicker">SỔ TAY THEO THỜI GIAN</p><h2>Lịch ghi chú</h2><p>Xem lại ý tưởng và ghi chú theo từng ngày.</p></div>
      {!isPastSelectedDate && <button className="calendar-create" onClick={() => { setEditing(null); setEditorOpen(true); }}><Icon name="plus" size={18} /> Ghi chú ngày này</button>}
    </header>
    {error && <p className="calendar-error">{error}</p>}
    <section className="calendar-shell">
      <div className="calendar-toolbar">
        <div className="calendar-month-label">{new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(month)}</div>
        <div className="calendar-nav"><button onClick={() => moveMonth(-1)} aria-label="Tháng trước"><Icon name="chevron-left" size={18} /></button><button onClick={() => { setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setSelectedDate(keyOf(new Date())); }}>Hôm nay</button><button onClick={() => moveMonth(1)} aria-label="Tháng sau"><Icon name="chevron-right" size={18} /></button></div>
      </div>
      <div className="calendar-grid">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
        {Array.from({ length: firstOffset }, (_, index) => <div key={`blank-${index}`} className="calendar-blank" />)}
        {Array.from({ length: days }, (_, index) => {
          const date = new Date(month.getFullYear(), month.getMonth(), index + 1);
          const key = keyOf(date);
          const count = byDate[key]?.length || 0;
          const lunar = solarToVietnameseLunar(date);
          const isLunarMonthStart = lunar.day === 1;
          const lunarLabel = isLunarMonthStart
            ? `1/${lunar.month}${lunar.isLeapMonth ? ' nhuận' : ''}`
            : `${lunar.day}`;
          const lunarFullDate = `Âm lịch: ngày ${lunar.day}, tháng ${lunar.month}${lunar.isLeapMonth ? ' nhuận' : ''}, năm ${lunar.year}`;
          return <button key={key} className={`calendar-day${selectedDate === key ? ' selected' : ''}${key === keyOf(new Date()) ? ' today' : ''}`} onClick={() => setSelectedDate(key)}>
            <span className="calendar-day-solar">{index + 1}</span><span className="calendar-day-lunar" title={lunarFullDate}>{lunarLabel}</span>{count > 0 && <span className="calendar-day-count">{count} ghi chú</span>}
          </button>;
        })}
      </div>
    </section>
    <section className="calendar-day-notes">
      <div className="selected-day-heading"><div><span className="calendar-kicker">GHI CHÚ TRONG NGÀY</span><h3>{new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${selectedDate}T12:00:00`))}</h3><p className="selected-day-lunar">Âm lịch: ngày {selectedLunarDate.day}, tháng {selectedLunarDate.month}{selectedLunarDate.isLeapMonth ? ' nhuận' : ''}, năm {selectedLunarDate.year}</p></div>{!isPastSelectedDate && <button onClick={() => { setEditing(null); setEditorOpen(true); }}><Icon name="plus" size={17} /> Tạo ghi chú</button>}</div>
      {selectedNotes.length ? <div className="calendar-note-list">{selectedNotes.map((note) => <button className={"calendar-note-card" + (hasCustomNoteBackground(note) ? " custom-paper" : "")} key={note.id} style={getNoteBackgroundStyle(note)} onClick={() => { setEditing(note); setEditorOpen(true); }}><strong>{note.title}</strong><span>{(note.content || 'Chưa có nội dung').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 180)}</span><small>{topics.find((topic) => topic.slug === note.topicSlug)?.name || 'Ghi chú'}</small></button>)}</div> : <div className="calendar-empty">{isPastSelectedDate ? 'Ngày này không có ghi chú để xem lại.' : <>Chưa có ghi chú trong ngày này. <button onClick={() => { setEditing(null); setEditorOpen(true); }}>Tạo ghi chú đầu tiên</button></>}</div>}
    </section>
    </>}
  </div>;
};
export default CalendarPage;
