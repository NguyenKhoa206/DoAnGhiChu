const path = require('node:path');
const fs = require('fs-extra');
const { getNotebookDir } = require('../utils/notebookStorage');
const { readJsonFile, writeJsonFile } = require('../utils/read_write');
const { withNotebookMutation } = require('../utils/notebookMutation');

const readArray = async (filePath) => {
  const items = await readJsonFile(filePath);
  if (items === null) return [];
  if (!Array.isArray(items)) throw new Error('Dữ liệu ghi chú phải là một mảng JSON.');
  return items;
};
const filesForReminders = async () => {
  const root = getNotebookDir();
  const notesDir = path.join(root, 'notes');
  const files = await fs.pathExists(notesDir) ? await fs.readdir(notesDir) : [];
  return [
    ...files.filter((name) => name.endsWith('.json')).map((name) => ({ path: path.join(notesDir, name), isPrivate: false })),
    { path: path.join(root, 'private.json'), isPrivate: true },
  ];
};
const summaryOf = (note, isPrivate) => ({
  id: note.id,
  title: isPrivate ? 'Một ghi chú riêng tư cần xem lại' : note.title,
  reminderAt: note.reminderAt,
  reminderNotifiedAt: note.reminderNotifiedAt || null,
  isPrivate,
});

module.exports = {
  getReminders: async (req, res) => {
    try {
      const reminders = [];
      for (const file of await filesForReminders()) {
        const notes = await readArray(file.path);
        reminders.push(...notes.filter((note) => note.reminderAt).map((note) => summaryOf(note, file.isPrivate)));
      }
      return res.json(reminders);
    } catch (error) {
      console.error('Lỗi tải lịch nhắc:', error);
      return res.status(500).json({ message: 'Không tải được lịch nhắc ghi chú.' });
    }
  },
  deliverReminder: (req, res) => withNotebookMutation(async () => {
    try {
      if (typeof req.body?.reminderAt !== 'string') return res.status(400).json({ message: 'Thiếu lịch nhắc cần xác nhận.' });
      for (const file of await filesForReminders()) {
        const notes = await readArray(file.path);
        const note = notes.find((item) => item.id === req.params.noteId);
        if (!note) continue;
        if (!note.reminderAt || note.reminderAt !== req.body.reminderAt || note.reminderNotifiedAt
          || new Date(note.reminderAt).getTime() > Date.now()) return res.json({ delivered: false });
        note.reminderNotifiedAt = new Date().toISOString();
        await writeJsonFile(file.path, notes);
        return res.json({ delivered: true, reminder: summaryOf(note, file.isPrivate) });
      }
      return res.status(404).json({ message: 'Ghi chú đã bị xóa hoặc không còn lịch nhắc.' });
    } catch (error) {
      console.error('Lỗi gửi nhắc ghi chú:', error);
      return res.status(500).json({ message: 'Không thể gửi thông báo nhắc.' });
    }
  }),
};
