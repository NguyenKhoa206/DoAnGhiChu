const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const reminderController = require('../controllers/reminderController');
const notebookMiddleware = require('../middleware/notebookMiddleware');
const privateAuthMiddleware = require('../middleware/privateAuthMiddleware');

// Áp dụng notebookMiddleware cho tất cả các endpoint quản lý ghi chú
router.use(notebookMiddleware);
// The legacy private URLs require the same grant as /api/private/notes.
router.use('/private', privateAuthMiddleware);

// Private reminders expose only a generic label, never encrypted note data.
router.get('/reminders', reminderController.getReminders);
router.post('/reminders/:noteId/deliver', reminderController.deliverReminder);

// Thùng rác thường và riêng tư có API / tệp lưu trữ riêng.
router.get('/trash', noteController.getTrash);
router.post('/trash/:noteId/restore', noteController.restoreTrashNote);
router.delete('/trash/:noteId', noteController.permanentlyDeleteTrashNote);
router.get('/private/trash', noteController.getPrivateTrash);
router.post('/private/trash/:noteId/restore', noteController.restorePrivateTrashNote);
router.delete('/private/trash/:noteId', noteController.permanentlyDeletePrivateTrashNote);

// ==========================================
// 1. CHỦ ĐỀ GHI CHÚ (TOPICS)
// ==========================================

/**
 * @route   GET /api/notes/topics
 * @desc    Lấy danh sách tất cả các chủ đề ghi chú của người dùng
 */
router.get('/topics', noteController.getTopics);

/**
 * @route   POST /api/notes/topics
 * @desc    Tạo một chủ đề ghi chú mới (khởi tạo file .json tương ứng)
 */
router.post('/topics', noteController.createTopic);
router.put('/topics/:topicId', noteController.updateTopic);

/**
 * @route   DELETE /api/notes/topics/:topicId
 * @desc    Xóa một chủ đề ghi chú (xóa file .json chủ đề)
 */
router.delete('/topics/:topicId', noteController.deleteTopic);

// ==========================================
// 2. GHI CHÚ RIÊNG TƯ (PRIVATE NOTES)
// (Đặt trước route /:noteId để tránh bị nhầm param)
// ==========================================

/**
 * @route   GET /api/notes/private
 * @desc    Lấy danh sách ghi chú riêng tư từ private.json
 */
router.get('/private', noteController.getPrivateNotes);

/**
 * @route   POST /api/notes/private
 * @desc    Thêm mới một ghi chú riêng tư (dữ liệu mã hóa)
 */
router.post('/private', noteController.createPrivateNote);

/**
 * @route   PUT /api/notes/private/:noteId
 * @desc    Cập nhật ghi chú riêng tư
 */
router.put('/private/:noteId', noteController.updatePrivateNote);

/**
 * @route   DELETE /api/notes/private/:noteId
 * @desc    Xóa ghi chú riêng tư
 */
router.delete('/private/:noteId', noteController.deletePrivateNote);

// ==========================================
// 3. GHI CHÚ CÔNG KHAI (PUBLIC NOTES)
// ==========================================

/**
 * @route   GET /api/notes
 * @desc    Lấy tất cả ghi chú công khai (hoặc lọc theo query ?topic=slug)
 */
router.get('/', noteController.getAllNotes);

/**
 * @route   POST /api/notes
 * @desc    Tạo mới một ghi chú công khai
 */
router.post('/', noteController.createNote);

/**
 * @route   PUT /api/notes/:noteId
 * @desc    Cập nhật nội dung ghi chú công khai theo ID
 */
router.put('/:noteId', noteController.updateNote);

/**
 * @route   DELETE /api/notes/:noteId
 * @desc    Xóa ghi chú công khai theo ID
 */
router.delete('/:noteId', noteController.deleteNote);

// Sprint 2 API. Topic-scoped edits/deletes only search that topic's JSON file.
router.get('/:topic', noteController.getAllNotes);
router.post('/:topic', noteController.createNote);
router.put('/:topic/:noteId', noteController.updateNote);
router.delete('/:topic/:noteId', noteController.deleteNote);

module.exports = router;
