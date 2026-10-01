const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // Vector khởi tạo (IV) chuẩn cho AES-256-CBC là 16 bytes

const getEncryptionKey = () => {
  const secret = process.env.SERVER_ENCRYPTION_KEY;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error('SERVER_ENCRYPTION_KEY must be set to at least 32 bytes.');
  }
  return crypto.scryptSync(secret, 'salt', 32);
};

/**
 * Băm (Hash) mật khẩu dạng nguyên bản bằng bcrypt
 * @param {string} password - Mật khẩu nguyên bản (plain-text)
 * @returns {Promise<string>} Chuỗi mật khẩu đã mã hóa hash
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * Đối chiếu mật khẩu nguyên bản với chuỗi hash trong cơ sở dữ liệu/file JSON
 * @param {string} password - Mật khẩu người dùng nhập
 * @param {string} hashedPassword - Chuỗi mật khẩu đã mã hóa hash
 * @returns {Promise<boolean>} Trả về true nếu mật khẩu chính xác
 */
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Mã hóa chuỗi văn bản bằng thuật toán AES-256-CBC
 * @param {string} text - Chuỗi văn bản cần mã hóa
 * @returns {string} Chuỗi dữ liệu mã hóa dạng iv:ciphertext (Hex)
 */
const encryptServerData = (text) => {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Lỗi mã hóa dữ liệu máy chủ:', error);
    throw error;
  }
};

/**
 * Giải mã chuỗi dữ liệu đã được mã hóa AES-256-CBC
 * @param {string} encryptedText - Chuỗi mã hóa dạng iv:ciphertext
 * @returns {string} Chuỗi văn bản nguyên bản sau khi giải mã
 */
const decryptServerData = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  try {
    const [ivHex, ciphertextHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Lỗi giải mã dữ liệu máy chủ:', error);
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  encryptServerData,
  decryptServerData,
};
