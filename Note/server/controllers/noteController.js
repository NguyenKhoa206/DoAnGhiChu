const path = require('path');
const fs = require('fs-extra');
const { randomUUID } = require('crypto');
const { readJsonFile, writeJsonFile } = require('../utils/read_write');
const { cleanNoteContent } = require('../utils/noteContent');
const { isValidNoteBackgroundImage } = require('../utils/noteBackground');
const { normalizeReminder, reminderError } = require('../utils/noteReminder');
const isTopicSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
const validColor = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
const cleanAttachments = (items) => Array.isArray(items) ? items.slice(0, 6).flatMap((item) => {
  const match = typeof item?.dataUrl === 'string'
    ? item.dataUrl.match(/^data:(image\/(?:png|jpeg|webp|gif)|application\/pdf|text\/plain);base64,([A-Za-z0-9+/]*={0,2})$/) : null;
  if (!match || typeof item.name !== 'string' || item.name.length > 120) return [];
  const padding = match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0;
  const byteLength = match[2].length * 3 / 4 - padding;
  if (byteLength < 1 || byteLength > 800 * 1024) return [];
  if (item.id !== undefined && (typeof item.id !== 'string' || !/^file_[a-zA-Z0-9_-]{6,64}$/.test(item.id))) return [];
  return [{ ...(item.id ? { id: item.id } : {}), name: item.name, type: match[1], dataUrl: item.dataUrl }];
}) : [];
const attachmentsAreValid = (items) => items === undefined || (
  Array.isArray(items) && items.length <= 6 && cleanAttachments(items).length === items.length
);
// Inline images are inside the encrypted content, rather than attachment metadata.
const MAX_PRIVATE_CONTENT_LENGTH = 8_000_000;

const { getNotebookDir, UNFILED_FILE } = require('../utils/notebookStorage');
const topicOfFile = (fileName) => fileName === UNFILED_FILE ? '' : fileName.replace(/\.json$/, '');
const fileOfTopic = (slug) => slug && !['ghi-chu', 'nhat-ky'].includes(slug) ? `${slug}.json` : UNFILED_FILE;
const getUserNotesDir = () => path.join(getNotebookDir(), 'notes');
const getUserTrashFilePath = () => path.join(getNotebookDir(), 'trash.json');
const getUserPrivateFilePath = () => path.join(getNotebookDir(), 'private.json');
const getUserPrivateTrashFilePath = () => path.join(getNotebookDir(), 'private-trash.json');
const getTopicNamesPath = () => path.join(getNotebookDir(), 'topics.json');
const readTopicNames = async () => {
  const names = await readJsonFile(getTopicNamesPath());
  if (names === null) return {};
  if (typeof names !== 'object' || Array.isArray(names)) throw new Error('Tên bộ sưu tập phải là một đối tượng JSON.');
  return names;
};
const topicNameOf = (slug, names) => {
  if (Object.hasOwn(names, slug) && typeof names[slug] === 'string' && names[slug].trim()) return names[slug];
  // Older notebooks only have a filename; retain access until the user supplies
  // the original display name instead of guessing Vietnamese diacritics.
  return slug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
const readArray = async (filePath) => {
  const data = await readJsonFile(filePath);
  if (data === null) return [];
  if (!Array.isArray(data)) throw new Error('Dữ liệu ghi chú phải là một mảng JSON.');
  return data;
};
const sendSavedNote = (req, res, status, note) => res.status(status).json(
  req.params?.topic || req.baseUrl === '/api/private'
    ? { success: true, note }
    : note
);

// Helper: Chuyển chuỗi tên chủ đề thành tên file .json chuẩn (slug)
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const noteController = {
  // ==========================================
  // 1. QUẢN LÝ CHỦ ĐỀ (PUBLIC TOPICS)
  // ==========================================

  /**
   * Lấy danh sách tất cả chủ đề ghi chú của user
   * GET /api/notes/topics
   */
  getTopics: async (req, res) => {
    try {
      const userId = req.user.userId;
      const notesDir = getUserNotesDir(userId);

      if (!await fs.pathExists(notesDir)) return res.status(200).json([]);
      const files = await fs.readdir(notesDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json') && f !== UNFILED_FILE);
      const names = await readTopicNames();

      const topics = jsonFiles.map((fileName) => {
        const slug = fileName.replace('.json', '');
        const name = topicNameOf(slug, names);

        return { id: slug, slug, name, fileName };
      });

      return res.status(200).json(topics);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách chủ đề:', error);
      return res.status(500).json({ message: 'Không thể lấy danh sách chủ đề.' });
    }
  },

  /**
   * Tạo một chủ đề ghi chú mới (Tạo file .json mới)
   * POST /api/notes/topics
   */
  createTopic: async (req, res) => {
    try {
      const userId = req.user.userId;
      const name = typeof req.body.name === 'string' ? req.body.name.normalize('NFC').trim() : '';

      if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) {
        return res.status(400).json({ message: 'Tên chủ đề không được để trống.' });
      }

      const slug = slugify(name);
      if (!isTopicSlug(slug)) return res.status(400).json({ message: 'Tên chủ đề không hợp lệ.' });
      if (['ghi-chu', 'nhat-ky'].includes(slug)) return res.status(400).json({ message: 'Vui lòng chọn tên bộ sưu tập khác.' });
      const notesDir = getUserNotesDir(userId);
      await fs.ensureDir(notesDir);

      const filePath = path.join(notesDir, `${slug}.json`);
      if (await fs.pathExists(filePath)) {
        return res.status(400).json({ message: 'Chủ đề này đã tồn tại.' });
      }
      const names = await readTopicNames();

      // Khởi tạo file json chủ đề mới chứa mảng rỗng []
      await writeJsonFile(filePath, []);
      try {
        await writeJsonFile(getTopicNamesPath(), { ...names, [slug]: name });
      } catch (writeError) {
        await fs.remove(filePath);
        throw writeError;
      }

      return res.status(201).json({
        message: 'Tạo chủ đề mới thành công.',
        topic: { id: slug, slug, name },
      });
    } catch (error) {
      console.error('Lỗi khi tạo chủ đề mới:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo chủ đề.' });
    }
  },

  /**
   * Xóa một chủ đề ghi chú (Xóa file .json tương ứng)
   * DELETE /api/notes/topics/:topicId
   */
  deleteTopic: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { topicId } = req.params; // topicId chính là slug
      if (!isTopicSlug(topicId)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });

      const notesDir = getUserNotesDir(userId);
      const filePath = path.join(notesDir, `${topicId}.json`);

      if (!await fs.pathExists(filePath)) {
        return res.status(404).json({ message: 'Chủ đề không tồn tại.' });
      }

      const notesInTopic = await readArray(filePath);
      const names = await readTopicNames();
      const topicName = topicNameOf(topicId, names);
      if (notesInTopic.length) {
        const trashPath = getUserTrashFilePath(userId);
        const trash = await readArray(trashPath);
        const deletedAt = new Date().toISOString();
        trash.unshift(...notesInTopic.map((note) => ({ ...note, originalTopicSlug: topicId, originalTopicName: topicName, deletedAt })));
        await writeJsonFile(trashPath, trash);
      }
      await fs.remove(filePath);
      return res.status(200).json({ message: 'Đã xóa chủ đề thành công.' });
    } catch (error) {
      console.error('Lỗi khi xóa chủ đề:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi xóa chủ đề.' });
    }
  },

  updateTopic: async (req, res) => {
    try {
      const userId = req.user.userId;
      const oldSlug = req.params.topicId;
      const name = typeof req.body.name === 'string' ? req.body.name.normalize('NFC').trim() : '';
      if (!name) return res.status(400).json({ message: 'Tên chủ đề không được để trống.' });
      if (name.length > 80 || !isTopicSlug(oldSlug)) return res.status(400).json({ message: 'Tên hoặc mã chủ đề không hợp lệ.' });
      const newSlug = slugify(name);
      if (!isTopicSlug(newSlug)) return res.status(400).json({ message: 'Tên chủ đề không hợp lệ.' });
      if (['ghi-chu', 'nhat-ky'].includes(newSlug)) return res.status(400).json({ message: 'Vui lòng chọn tên bộ sưu tập khác.' });
      const notesDir = getUserNotesDir(userId);
      const oldPath = path.join(notesDir, `${oldSlug}.json`);
      const newPath = path.join(notesDir, `${newSlug}.json`);
      if (!await fs.pathExists(oldPath)) return res.status(404).json({ message: 'Chủ đề không tồn tại.' });
      if (newSlug !== oldSlug && await fs.pathExists(newPath)) return res.status(409).json({ message: 'Đã có chủ đề cùng tên.' });
      const names = await readTopicNames();
      const nextNames = { ...names, [newSlug]: name };
      if (newSlug !== oldSlug) delete nextNames[oldSlug];
      const trashPath = getUserTrashFilePath(userId);
      const trash = await readArray(trashPath);
      const nextTrash = trash.map((note) => note.originalTopicSlug === oldSlug
        ? { ...note, originalTopicSlug: newSlug, originalTopicName: name }
        : note);
      if (newSlug !== oldSlug) await fs.move(oldPath, newPath);
      let namesWritten = false;
      try {
        await writeJsonFile(getTopicNamesPath(), nextNames);
        namesWritten = true;
        if (nextTrash.some((note, index) => note !== trash[index])) await writeJsonFile(trashPath, nextTrash);
      } catch (writeError) {
        if (newSlug !== oldSlug) await fs.move(newPath, oldPath);
        if (namesWritten) await writeJsonFile(getTopicNamesPath(), names);
        throw writeError;
      }
      return res.status(200).json({ message: 'Đã đổi tên chủ đề.', topic: { id: newSlug, slug: newSlug, name } });
    } catch (error) {
      console.error('Lỗi đổi tên chủ đề:', error);
      return res.status(500).json({ message: 'Không thể đổi tên chủ đề.' });
    }
  },

  // ==========================================
  // 2. QUẢN LÝ GHI CHÚ CÔNG KHAI (PUBLIC NOTES)
  // ==========================================

  /**
   * Lấy tất cả ghi chú (Có thể lọc theo ?topic=hoc-tap)
   * GET /api/notes
   */
  getAllNotes: async (req, res) => {
    try {
      const userId = req.user.userId;
      const topic = req.params?.topic ?? req.query?.topic;
      const notesDir = getUserNotesDir(userId);

      if (topic && !isTopicSlug(topic)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });

      if (!await fs.pathExists(notesDir)) return res.status(200).json([]);

      let allNotes = [];

      if (topic) {
        // Lấy ghi chú của 1 chủ đề cụ thể
        const filePath = path.join(notesDir, fileOfTopic(topic));
        if (await fs.pathExists(filePath)) {
          const topicNotes = await readArray(filePath);
          allNotes = (topicNotes || []).map((n) => ({ ...n, topicSlug: topicOfFile(fileOfTopic(topic)) }));
        }
      } else {
        // Tổng hợp ghi chú từ TẤT CẢ các file .json chủ đề hiện có
        const files = await fs.readdir(notesDir);
        const jsonFiles = files.filter((f) => f.endsWith('.json'));

        for (const fileName of jsonFiles) {
          const topicSlug = topicOfFile(fileName);
          const filePath = path.join(notesDir, fileName);
          const topicNotes = await readArray(filePath);

          if (Array.isArray(topicNotes)) {
            const mappedNotes = topicNotes.map((n) => ({ ...n, topicSlug }));
            allNotes.push(...mappedNotes);
          }
        }
      }

      return res.status(200).json(allNotes);
    } catch (error) {
      console.error('Lỗi lấy danh sách ghi chú:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách ghi chú.' });
    }
  },

  /**
   * Tạo ghi chú công khai mới
   * POST /api/notes
   */
  createNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { title = '', content = '', noteDate, reminderAt, backgroundColor, backgroundImage, attachments, isFavorite, isPinned } = req.body;
      const topicSlug = req.params?.topic ?? req.body.topicSlug;

      if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) {
        return res.status(400).json({ message: 'Tiêu đề ghi chú cần từ 1 đến 160 ký tự, không chỉ gồm khoảng trắng.' });
      }
      if (typeof content !== 'string') return res.status(400).json({ message: 'Nội dung ghi chú phải là văn bản.' });
      if (topicSlug !== undefined && (typeof topicSlug !== 'string' || topicSlug.length > 80)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });
      if (req.params?.topic !== undefined && !isTopicSlug(req.params.topic)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });
      if ((isFavorite !== undefined && typeof isFavorite !== 'boolean') || (isPinned !== undefined && typeof isPinned !== 'boolean')) return res.status(400).json({ message: 'Trạng thái ghim hoặc yêu thích không hợp lệ.' });
      if (!isValidNoteBackgroundImage(backgroundImage)) return res.status(400).json({ message: 'Ảnh nền không hợp lệ hoặc vượt quá 800 KB.' });
      if (!attachmentsAreValid(attachments)) return res.status(400).json({ message: 'Tệp đính kèm không đúng định dạng hoặc vượt giới hạn 6 tệp, 800 KB mỗi tệp.' });
      const scheduleError = reminderError(reminderAt);
      if (scheduleError) return res.status(400).json({ message: scheduleError });

      const notesDir = getUserNotesDir(userId);
      await fs.ensureDir(notesDir);

      const targetFile = fileOfTopic(slugify(topicSlug || ''));
      const targetSlug = topicOfFile(targetFile);
      const filePath = path.join(notesDir, targetFile);

      let notes = [];
      if (await fs.pathExists(filePath)) {
        notes = await readArray(filePath);
      }

      const newNote = {
        id: `note_${randomUUID()}`,
        title: title.normalize('NFC').trim(),
        content: cleanNoteContent(content),
        noteDate: validDate(noteDate) ? noteDate : new Date().toISOString().slice(0, 10),
        backgroundColor: validColor(backgroundColor) ? backgroundColor : '#fffdf8',
        backgroundImage: backgroundImage || '',
        attachments: cleanAttachments(attachments),
        isFavorite: isFavorite === true,
        isPinned: isPinned === true,
        reminderAt: normalizeReminder(reminderAt),
        reminderNotifiedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      notes.unshift(newNote); // Thêm lên đầu danh sách
      await writeJsonFile(filePath, notes);

      return sendSavedNote(req, res, 201, { ...newNote, topicSlug: targetSlug });
    } catch (error) {
      console.error('Lỗi tạo ghi chú mới:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo ghi chú mới.' });
    }
  },

  /**
   * Cập nhật ghi chú công khai
   * PUT /api/notes/:noteId
   */
  updateNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { noteId } = req.params;
      const { title, content, noteDate, reminderAt, backgroundColor, backgroundImage, attachments, isFavorite, isPinned } = req.body;
      const topic = req.params.topic;
      if (topic !== undefined && !isTopicSlug(topic)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });
      if (title !== undefined && (typeof title !== 'string' || !title.trim() || title.trim().length > 160)) {
        return res.status(400).json({ message: 'Tiêu đề ghi chú cần từ 1 đến 160 ký tự, không chỉ gồm khoảng trắng.' });
      }
      if (content !== undefined && typeof content !== 'string') return res.status(400).json({ message: 'Nội dung ghi chú phải là văn bản.' });
      if (!isValidNoteBackgroundImage(backgroundImage)) return res.status(400).json({ message: 'Ảnh nền không hợp lệ hoặc vượt quá 800 KB.' });
      if (!attachmentsAreValid(attachments)) return res.status(400).json({ message: 'Tệp đính kèm không đúng định dạng hoặc vượt giới hạn 6 tệp, 800 KB mỗi tệp.' });
      if ((isFavorite !== undefined && typeof isFavorite !== 'boolean') || (isPinned !== undefined && typeof isPinned !== 'boolean')) return res.status(400).json({ message: 'Trạng thái ghim hoặc yêu thích không hợp lệ.' });

      const notesDir = getUserNotesDir(userId);
      if (!await fs.pathExists(notesDir)) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú cần sửa.' });
      }
      const files = await fs.readdir(notesDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json') && (topic === undefined || f === fileOfTopic(topic)));

      let found = false;
      let updatedNote = null;

      for (const fileName of jsonFiles) {
        const filePath = path.join(notesDir, fileName);
        let notes = await readArray(filePath);

        const index = notes.findIndex((n) => n.id === noteId);
        if (index !== -1) {
          const scheduleError = reminderAt !== undefined ? reminderError(reminderAt, notes[index].reminderAt) : '';
          if (scheduleError) return res.status(400).json({ message: scheduleError });
          const nextReminder = reminderAt === undefined ? notes[index].reminderAt || null : normalizeReminder(reminderAt);
          found = true;
          notes[index] = {
            ...notes[index],
            title: title !== undefined ? (title.normalize('NFC').trim()) : notes[index].title,
            content: content !== undefined ? cleanNoteContent(content) : notes[index].content,
            noteDate: validDate(noteDate) ? noteDate : notes[index].noteDate,
            backgroundColor: validColor(backgroundColor) ? backgroundColor : notes[index].backgroundColor,
            backgroundImage: backgroundImage !== undefined ? backgroundImage : (notes[index].backgroundImage || ''),
            attachments: attachments !== undefined ? cleanAttachments(attachments) : (notes[index].attachments || []),
            isFavorite: isFavorite !== undefined ? isFavorite : notes[index].isFavorite === true,
            isPinned: isPinned !== undefined ? isPinned : notes[index].isPinned === true,
            reminderAt: nextReminder,
            reminderNotifiedAt: nextReminder === (notes[index].reminderAt || null) ? notes[index].reminderNotifiedAt || null : null,
            updatedAt: new Date().toISOString(),
          };

          updatedNote = { ...notes[index], topicSlug: topicOfFile(fileName) };
          await writeJsonFile(filePath, notes);
          break;
        }
      }

      if (!found) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú cần sửa.' });
      }

      return sendSavedNote(req, res, 200, updatedNote);
    } catch (error) {
      console.error('Lỗi cập nhật ghi chú:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi sửa ghi chú.' });
    }
  },

  /**
   * Xóa ghi chú công khai theo ID
   * DELETE /api/notes/:noteId
   */
  deleteNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { noteId } = req.params;

      const topic = req.params.topic;
      if (topic !== undefined && !isTopicSlug(topic)) return res.status(400).json({ message: 'Mã chủ đề không hợp lệ.' });

      const notesDir = getUserNotesDir(userId);
      if (!await fs.pathExists(notesDir)) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú để xóa.' });
      }
      const files = await fs.readdir(notesDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json') && (topic === undefined || f === fileOfTopic(topic)));
      const names = await readTopicNames();

      let deletedNote = null;
      let activeFilePath = null;
      let remainingNotes = null;

      for (const fileName of jsonFiles) {
        const filePath = path.join(notesDir, fileName);
        let notes = await readArray(filePath);

        const note = notes.find((item) => item.id === noteId);
        if (note) {
          const originalTopicSlug = topicOfFile(fileName);
          deletedNote = { ...note, originalTopicSlug, ...(originalTopicSlug ? { originalTopicName: topicNameOf(originalTopicSlug, names) } : {}), deletedAt: new Date().toISOString() };
          activeFilePath = filePath;
          remainingNotes = notes.filter((item) => item.id !== noteId);
          break;
        }
      }

      if (!deletedNote) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú để xóa.' });
      }

      const trashPath = getUserTrashFilePath(userId);
      const trash = await readArray(trashPath);
      const previousTrash = [...trash];
      trash.unshift(deletedNote);
      await writeJsonFile(trashPath, trash);
      try {
        await writeJsonFile(activeFilePath, remainingNotes);
      } catch (writeError) {
        await writeJsonFile(trashPath, previousTrash);
        throw writeError;
      }
      return res.status(200).json({ success: true, message: 'Đã chuyển ghi chú vào thùng rác.', note: deletedNote });
    } catch (error) {
      console.error('Lỗi xóa ghi chú:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi xóa ghi chú.' });
    }
  },

  getTrash: async (req, res) => {
    try {
      const names = await readTopicNames();
      const trash = await readArray(getUserTrashFilePath(req.user.userId));
      return res.status(200).json(trash.map((note) => note.originalTopicSlug
        ? { ...note, originalTopicName: note.originalTopicName || topicNameOf(note.originalTopicSlug, names) }
        : note));
    } catch (error) {
      console.error('Lỗi lấy thùng rác:', error);
      return res.status(500).json({ message: 'Không thể tải thùng rác.' });
    }
  },

  restoreTrashNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const trashPath = getUserTrashFilePath(userId);
      const trash = await readArray(trashPath);
      const index = trash.findIndex((item) => item.id === req.params.noteId);
      if (index < 0) return res.status(404).json({ message: 'Không tìm thấy ghi chú trong thùng rác.' });
      const [note] = trash.splice(index, 1);
      const targetFile = fileOfTopic(isTopicSlug(note.originalTopicSlug) ? note.originalTopicSlug : '');
      const targetSlug = topicOfFile(targetFile);
      const notesDir = getUserNotesDir(userId);
      await fs.ensureDir(notesDir);
      const targetPath = path.join(notesDir, targetFile);
      const targetNotes = await readArray(targetPath);
      const { deletedAt, originalTopicSlug, originalTopicName, ...restoredNote } = note;
      if (targetSlug && originalTopicName && !await fs.pathExists(targetPath)) {
        const names = await readTopicNames();
        await writeJsonFile(getTopicNamesPath(), { ...names, [targetSlug]: originalTopicName });
      }
      targetNotes.unshift(restoredNote);
      await writeJsonFile(targetPath, targetNotes);
      await writeJsonFile(trashPath, trash);
      return res.status(200).json({ ...restoredNote, topicSlug: targetSlug });
    } catch (error) {
      console.error('Lỗi khôi phục ghi chú:', error);
      return res.status(500).json({ message: 'Không thể khôi phục ghi chú.' });
    }
  },

  permanentlyDeleteTrashNote: async (req, res) => {
    try {
      const trashPath = getUserTrashFilePath(req.user.userId);
      const trash = await readArray(trashPath);
      const nextTrash = trash.filter((item) => item.id !== req.params.noteId);
      if (nextTrash.length === trash.length) return res.status(404).json({ message: 'Không tìm thấy ghi chú trong thùng rác.' });
      await writeJsonFile(trashPath, nextTrash);
      return res.status(200).json({ message: 'Đã xóa ghi chú vĩnh viễn.' });
    } catch (error) {
      console.error('Lỗi xóa vĩnh viễn ghi chú:', error);
      return res.status(500).json({ message: 'Không thể xóa ghi chú vĩnh viễn.' });
    }
  },

  // ==========================================
  // 3. QUẢN LÝ GHI CHÚ RIÊNG TƯ (PRIVATE NOTES)
  // ==========================================

  /**
   * Lấy danh sách ghi chú riêng tư từ private.json
   * GET /api/notes/private
   */
  getPrivateNotes: async (req, res) => {
  try {
    const userId = req.user.userId;
    const privateFilePath = getUserPrivateFilePath(userId);

    // Nếu chưa có file private.json, tự động khởi tạo mảng rỗng []
    if (!await fs.pathExists(privateFilePath)) {
      await writeJsonFile(privateFilePath, []);
      return res.status(200).json([]);
    }

    const privateNotes = await readArray(privateFilePath);
    return res.status(200).json(privateNotes || []);
  } catch (error) {
    console.error('Lỗi lấy ghi chú riêng tư:', error);
    return res.status(500).json({ message: 'Không thể tải ghi chú riêng tư.' });
  }
},

  /**
   * Thêm ghi chú riêng tư mới (Lưu dữ liệu mã hóa từ FE gửi lên)
   * POST /api/notes/private
   */
  createPrivateNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { title, content, metadata, reminderAt } = req.body; // Dữ liệu đã được mã hóa ở Client
      if (typeof title !== 'string' || !title || title.length > 1_000_000
        || typeof content !== 'string' || content.length > MAX_PRIVATE_CONTENT_LENGTH) {
        return res.status(400).json({ message: 'Tiêu đề hoặc nội dung ghi chú riêng tư không hợp lệ.' });
      }
      if (metadata !== undefined && (typeof metadata !== 'string' || metadata.length > 8_000_000)) {
        return res.status(400).json({ message: 'Dữ liệu bổ sung của ghi chú riêng tư vượt quá giới hạn.' });
      }

      const scheduleError = reminderError(reminderAt);
      if (scheduleError) return res.status(400).json({ message: scheduleError });

      const privateFilePath = getUserPrivateFilePath(userId);
      let privateNotes = [];

      if (await fs.pathExists(privateFilePath)) {
        privateNotes = await readArray(privateFilePath);
      }

      const newPrivateNote = {
        id: `pnote_${randomUUID()}`,
        title,
        content,
        ...(typeof metadata === 'string' ? { metadata } : {}),
        reminderAt: normalizeReminder(reminderAt),
        reminderNotifiedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      privateNotes.unshift(newPrivateNote);
      await writeJsonFile(privateFilePath, privateNotes);

      return sendSavedNote(req, res, 201, newPrivateNote);
    } catch (error) {
      console.error('Lỗi thêm ghi chú riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi thêm ghi chú riêng tư.' });
    }
  },

  /**
   * Cập nhật ghi chú riêng tư
   * PUT /api/notes/private/:noteId
   */
  updatePrivateNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { noteId } = req.params;
      const { title, content, metadata, reminderAt } = req.body;
      if ((title !== undefined && (typeof title !== 'string' || !title || title.length > 1_000_000))
        || (content !== undefined && (typeof content !== 'string' || content.length > MAX_PRIVATE_CONTENT_LENGTH))) {
        return res.status(400).json({ message: 'Tiêu đề hoặc nội dung ghi chú riêng tư không hợp lệ.' });
      }
      if (metadata !== undefined && (typeof metadata !== 'string' || metadata.length > 8_000_000)) {
        return res.status(400).json({ message: 'Dữ liệu bổ sung của ghi chú riêng tư vượt quá giới hạn.' });
      }

      const privateFilePath = getUserPrivateFilePath(userId);
      if (!await fs.pathExists(privateFilePath)) {
        return res.status(404).json({ message: 'Tệp ghi chú riêng tư không tồn tại.' });
      }

      let privateNotes = await readArray(privateFilePath);
      const index = privateNotes.findIndex((n) => n.id === noteId);

      if (index === -1) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú riêng tư cần sửa.' });
      }

      const scheduleError = reminderAt !== undefined ? reminderError(reminderAt, privateNotes[index].reminderAt) : '';
      if (scheduleError) return res.status(400).json({ message: scheduleError });
      const nextReminder = reminderAt === undefined ? privateNotes[index].reminderAt || null : normalizeReminder(reminderAt);

      privateNotes[index] = {
        ...privateNotes[index],
        title: title !== undefined ? title : privateNotes[index].title,
        content: content !== undefined ? content : privateNotes[index].content,
        ...(typeof metadata === 'string' ? { metadata } : {}),
        reminderAt: nextReminder,
        reminderNotifiedAt: nextReminder === (privateNotes[index].reminderAt || null) ? privateNotes[index].reminderNotifiedAt || null : null,
        updatedAt: new Date().toISOString(),
      };

      await writeJsonFile(privateFilePath, privateNotes);
      return sendSavedNote(req, res, 200, privateNotes[index]);
    } catch (error) {
      console.error('Lỗi sửa ghi chú riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật ghi chú riêng tư.' });
    }
  },

  /**
   * Xóa ghi chú riêng tư
   * DELETE /api/notes/private/:noteId
   */
  deletePrivateNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { noteId } = req.params;

      const privateFilePath = getUserPrivateFilePath(userId);
      if (!await fs.pathExists(privateFilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy tệp ghi chú riêng tư.' });
      }

      const privateNotes = await readArray(privateFilePath);
      const deletedNote = privateNotes.find((note) => note.id === noteId);

      if (!deletedNote) {
        return res.status(404).json({ message: 'Không tìm thấy ghi chú riêng tư để xóa.' });
      }

      const privateTrashPath = getUserPrivateTrashFilePath(userId);
      const privateTrash = await readArray(privateTrashPath);
      const previousPrivateTrash = [...privateTrash];
      privateTrash.unshift({ ...deletedNote, deletedAt: new Date().toISOString() });
      await writeJsonFile(privateTrashPath, privateTrash);
      try {
        await writeJsonFile(privateFilePath, privateNotes.filter((note) => note.id !== noteId));
      } catch (writeError) {
        await writeJsonFile(privateTrashPath, previousPrivateTrash);
        throw writeError;
      }
      return res.status(200).json({ success: true, message: 'Đã chuyển ghi chú riêng tư vào thùng rác.' });
    } catch (error) {
      console.error('Lỗi xóa ghi chú riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi xóa ghi chú riêng tư.' });
    }
  },

  getPrivateTrash: async (req, res) => {
    try {
      return res.status(200).json(await readArray(getUserPrivateTrashFilePath(req.user.userId)));
    } catch (error) {
      console.error('Lỗi lấy thùng rác riêng tư:', error);
      return res.status(500).json({ message: 'Không thể tải thùng rác riêng tư.' });
    }
  },

  restorePrivateTrashNote: async (req, res) => {
    try {
      const userId = req.user.userId;
      const privateTrashPath = getUserPrivateTrashFilePath(userId);
      const privateTrash = await readArray(privateTrashPath);
      const index = privateTrash.findIndex((note) => note.id === req.params.noteId);
      if (index < 0) return res.status(404).json({ message: 'Không tìm thấy ghi chú riêng tư trong thùng rác.' });
      const [note] = privateTrash.splice(index, 1);
      const { deletedAt, ...restoredNote } = note;
      const privateFilePath = getUserPrivateFilePath(userId);
      const privateNotes = await readArray(privateFilePath);
      privateNotes.unshift(restoredNote);
      await writeJsonFile(privateFilePath, privateNotes);
      await writeJsonFile(privateTrashPath, privateTrash);
      return res.status(200).json(restoredNote);
    } catch (error) {
      console.error('Lỗi khôi phục ghi chú riêng tư:', error);
      return res.status(500).json({ message: 'Không thể khôi phục ghi chú riêng tư.' });
    }
  },

  permanentlyDeletePrivateTrashNote: async (req, res) => {
    try {
      const privateTrashPath = getUserPrivateTrashFilePath(req.user.userId);
      const privateTrash = await readArray(privateTrashPath);
      const nextTrash = privateTrash.filter((note) => note.id !== req.params.noteId);
      if (nextTrash.length === privateTrash.length) return res.status(404).json({ message: 'Không tìm thấy ghi chú riêng tư trong thùng rác.' });
      await writeJsonFile(privateTrashPath, nextTrash);
      return res.status(200).json({ message: 'Đã xóa ghi chú riêng tư vĩnh viễn.' });
    } catch (error) {
      console.error('Lỗi xóa vĩnh viễn ghi chú riêng tư:', error);
      return res.status(500).json({ message: 'Không thể xóa ghi chú riêng tư vĩnh viễn.' });
    }
  },
};

const { withNotebookMutation } = require('../utils/notebookMutation');
const privateAuthMiddleware = require('../middleware/privateAuthMiddleware');
for (const action of ['createTopic', 'updateTopic', 'deleteTopic', 'createNote', 'updateNote', 'deleteNote',
  'restoreTrashNote', 'permanentlyDeleteTrashNote', 'createPrivateNote', 'updatePrivateNote',
  'deletePrivateNote', 'restorePrivateTrashNote', 'permanentlyDeletePrivateTrashNote']) {
  const handler = noteController[action];
  noteController[action] = (req, res) => withNotebookMutation(() => action.includes('Private')
    ? privateAuthMiddleware(req, res, () => handler(req, res)) : handler(req, res));
}
module.exports = noteController;
