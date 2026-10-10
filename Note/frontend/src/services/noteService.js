import api from './api.js';

const topicPath = (topic) => topic && !['topics', 'private', 'trash', 'reminders'].includes(topic)
  ? `/notes/${encodeURIComponent(topic)}` : '/notes';
const announceReminderChange = () => window.dispatchEvent(new Event('nep:reminders-changed'));
const savedNoteOf = (response) => response.data?.note || response.data;
const privateRequest = (privateToken) => {
  if (!privateToken) {
    const error = new Error('Vui lòng mở khóa vùng ghi chú riêng tư.');
    error.code = 'PRIVATE_LOCKED';
    throw error;
  }
  return { headers: { 'X-Private-Token': privateToken } };
};
export const isPrivateLockedError = (error) => error?.code === 'PRIVATE_LOCKED'
  || ['PRIVATE_LOCKED', 'PRIVATE_RATE_LIMITED'].includes(error?.response?.data?.code);

const noteService = {
  // ==========================================
  // 1. QUẢN LÝ CHỦ ĐỀ GHI CHÚ (PUBLIC TOPICS)
  // ==========================================

  /**
   * Lấy danh sách tất cả các chủ đề ghi chú người dùng đã tạo
   * GET /api/notes/topics
   */
  getTopics: async () => {
    const response = await api.get('/notes/topics');
    return response.data;
  },

  /**
   * Tạo một chủ đề ghi chú mới (Ví dụ: "Học tập", "Công việc")
   * POST /api/notes/topics
   */
  createTopic: async (topicName) => {
    const response = await api.post('/notes/topics', { name: topicName });
    return response.data;
  },

  /**
   * Cập nhật tên chủ đề ghi chú
   * PUT /api/notes/topics/:topicId
   */
  updateTopic: async (topicId, newName) => {
    const response = await api.put(`/notes/topics/${topicId}`, { name: newName });
    return response.data;
  },

  /**
   * Xóa một chủ đề ghi chú (Xóa file .json chủ đề tương ứng)
   * DELETE /api/notes/topics/:topicId
   */
  deleteTopic: async (topicId) => {
    const response = await api.delete(`/notes/topics/${topicId}`);
    announceReminderChange();
    return response.data;
  },

  // ==========================================
  // 2. QUẢN LÝ GHI CHÚ CÔNG KHAI (PUBLIC NOTES)
  // ==========================================

  /**
   * Lấy tất cả ghi chú (hoặc lọc theo topicSlug nếu truyền vào)
   * GET /api/notes hoặc /api/notes/:topic
   */
  getAllNotes: async (topicSlug = null) => {
    const url = topicSlug && topicPath(topicSlug) === '/notes'
      ? `/notes?topic=${encodeURIComponent(topicSlug)}` : topicPath(topicSlug);
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Thêm một ghi chú công khai mới
   * POST /api/notes/:topic
   */
  createNote: async (noteData) => {
    const response = await api.post(topicPath(noteData.topicSlug), noteData);
    announceReminderChange();
    return savedNoteOf(response);
  },

  /**
   * Cập nhật ghi chú, có thể đổi bộ sưu tập qua noteData.topicSlug.
   * URL dùng bộ sưu tập nguồn; bỏ nguồn để tìm theo ID trong toàn bộ sổ tay.
   */
  updateNote: async (noteId, noteData, sourceTopicSlug) => {
    const response = await api.put(`${topicPath(sourceTopicSlug)}/${encodeURIComponent(noteId)}`, noteData);
    announceReminderChange();
    return savedNoteOf(response);
  },

  /**
   * Xóa ghi chú công khai theo ID
   * DELETE /api/notes/:topic/:noteId (hỗ trợ URL cũ chỉ có noteId)
   */
  deleteNote: async (noteId, topicSlug) => {
    const response = await api.delete(`${topicPath(topicSlug)}/${encodeURIComponent(noteId)}`);
    announceReminderChange();
    return response.data;
  },

  getTrash: async () => (await api.get('/notes/trash')).data,
  restoreTrashNote: async (noteId) => { const response = await api.post(`/notes/trash/${noteId}/restore`); announceReminderChange(); return response.data; },
  permanentlyDeleteTrashNote: async (noteId) => (await api.delete(`/notes/trash/${noteId}`)).data,

  // ==========================================
  // 3. QUẢN LÝ GHI CHÚ RIÊNG TƯ (PRIVATE NOTES)
  // ==========================================

  /**
   * Lấy danh sách ghi chú riêng tư từ file private.json (Dữ liệu đã mã hóa)
   * GET /api/private/notes - yêu cầu privateToken của phiên mở khóa
   */
  getPrivateNotes: async (privateToken) => {
    const response = await api.get('/private/notes', privateRequest(privateToken));
    return response.data;
  },

  getPrivateTrash: async (privateToken) => (await api.get('/private/trash', privateRequest(privateToken))).data,
  restorePrivateTrashNote: async (noteId, privateToken) => { const response = await api.post(`/private/trash/${encodeURIComponent(noteId)}/restore`, {}, privateRequest(privateToken)); announceReminderChange(); return response.data; },
  permanentlyDeletePrivateTrashNote: async (noteId, privateToken) => (await api.delete(`/private/trash/${encodeURIComponent(noteId)}`, privateRequest(privateToken))).data,

  /**
   * Thêm một ghi chú riêng tư mới (Đã mã hóa tiêu đề & nội dung ở FE)
   * POST /api/private/notes
   */
  createPrivateNote: async (encryptedNoteData, privateToken) => {
    const response = await api.post('/private/notes', encryptedNoteData, privateRequest(privateToken));
    announceReminderChange();
    return savedNoteOf(response);
  },

  /**
   * Cập nhật ghi chú riêng tư (Mã hóa lại dữ liệu mới)
   * PUT /api/private/notes/:noteId
   */
  updatePrivateNote: async (noteId, encryptedNoteData, privateToken) => {
    const response = await api.put(`/private/notes/${encodeURIComponent(noteId)}`, encryptedNoteData, privateRequest(privateToken));
    announceReminderChange();
    return savedNoteOf(response);
  },

  /**
   * Xóa một ghi chú riêng tư
   * DELETE /api/private/notes/:noteId
   */
  deletePrivateNote: async (noteId, privateToken) => {
    const response = await api.delete(`/private/notes/${encodeURIComponent(noteId)}`, privateRequest(privateToken));
    announceReminderChange();
    return response.data;
  },
  getReminders: async () => (await api.get('/notes/reminders')).data,
  deliverReminder: async (noteId, reminderAt) => (await api.post(`/notes/reminders/${encodeURIComponent(noteId)}/deliver`, { reminderAt })).data,
};

export default noteService;
