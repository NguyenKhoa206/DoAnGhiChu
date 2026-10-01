const path = require('path');
const fs = require('fs-extra');

// ✅ Cố định chính xác vị trí vào: /server/data/users/
// __dirname là /server/utils/ -> '../data/users' trỏ về /server/data/users/
const DATA_DIR = path.resolve(__dirname, '../data/users');

/**
 * Đọc file JSON an toàn, trả về null nếu file không tồn tại
 */
const readJsonFile = async (filePath) => {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Lỗi khi đọc tệp JSON (${filePath}):`, error);
    throw error;
  }
};

/**
 * Ghi dữ liệu vào file JSON với định dạng lề thụt 2 spaces
 */
const writeJsonFile = async (filePath, data) => {
  try {
    await fs.ensureFile(filePath);
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error(`Lỗi khi ghi tệp JSON (${filePath}):`, error);
    throw error;
  }
};

/**
 * Lấy đường dẫn thư mục của người dùng
 */
const getUserDir = (userIdOrUsername) => {
  return path.join(DATA_DIR, userIdOrUsername);
};

/**
 * Khởi tạo hồ sơ người dùng; các thư mục dữ liệu khác chỉ được tạo khi cần.
 */
const createUserDataFolder = async (username, profileData) => {
  const userDir = getUserDir(username);
  await writeJsonFile(path.join(userDir, 'profile.json'), profileData);

  return userDir;
};

module.exports = {
  DATA_DIR,
  readJsonFile,
  writeJsonFile,
  getUserDir,
  createUserDataFolder,
};
