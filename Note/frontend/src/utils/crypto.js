/**
 * Utility hỗ trợ Mã hóa và Giải mã dữ liệu phía Client
 * Phục vụ cho tính năng Ghi Chú Riêng Tư (Private Notes)
 */

// Hàm chuyển chuỗi văn bản thành ArrayBuffer
const textToBuffer = (text) => new TextEncoder().encode(text);

// Hàm chuyển ArrayBuffer thành chuỗi văn bản
const bufferToText = (buffer) => new TextDecoder().decode(buffer);

// Chuyển ArrayBuffer thành chuỗi Hex/Base64 để lưu trữ JSON
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return btoa(chunks.join(''));
};

// Chuyển chuỗi Base64 ngược lại thành ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Includes the GCM tag and both Base64 layers used by encryptText.
export const encryptedLengthForBytes = (bytes) => {
  if (!bytes) return 0;
  const ciphertextLength = 4 * Math.ceil((bytes + 16) / 3);
  const envelopeLength = JSON.stringify({ iv: '0'.repeat(16), ciphertext: '' }).length;
  return 4 * Math.ceil((envelopeLength + ciphertextLength) / 3);
};

export const estimateEncryptedTextLength = (text) => encryptedLengthForBytes(textToBuffer(text || '').byteLength);

// Tạo Secret Key từ Mật khẩu người dùng nhập bằng PBKDF2
const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Mã hóa chuỗi văn bản bằng Mật khẩu riêng tư (AES-GCM)
 * @param {string} plainText - Văn bản nguyên bản cần mã hóa
 * @param {string} secretPassword - Mật khẩu bí mật của người dùng
 * @returns {string} Chuỗi dữ liệu mã hóa dạng Base64 (bao gồm iv, salt và ciphertext)
 */
export const encryptText = async (plainText, secretPassword) => {
  if (!secretPassword) throw new Error('Vui lòng mở khóa vùng ghi chú riêng tư trước khi lưu.');
  if (!plainText) return '';

  try {
    // 1. Tạo ngẫu nhiên Vector khởi tạo (IV) và Salt
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const salt = 'noteapp_private_salt_2026'; // Salt cố định hoặc ngẫu nhiên

    // 2. Tạo khóa mã hóa từ mật khẩu
    const key = await deriveKey(secretPassword, salt);

    // 3. Thực hiện mã hóa AES-GCM
    const encodedContent = textToBuffer(plainText);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedContent
    );

    // 4. Ghép IV và Nội dung mã hóa thành payload định dạng JSON rồi chuyển sang Base64
    const payload = {
      iv: bufferToBase64(iv),
      ciphertext: bufferToBase64(encryptedBuffer),
    };

    return btoa(JSON.stringify(payload));
  } catch (error) {
    console.error('Lỗi mã hóa dữ liệu:', error);
    throw new Error('Không thể mã hóa ghi chú. Vui lòng dùng trình duyệt hỗ trợ WebCrypto qua HTTPS hoặc localhost.');
  }
};

/**
 * Giải mã chuỗi văn bản bằng Mật khẩu riêng tư
 * @param {string} encryptedBase64 - Chuỗi mã hóa Base64
 * @param {string} secretPassword - Mật khẩu bí mật của người dùng
 * @returns {string} Chuỗi văn bản đã giải mã nguyên bản
 */
export const decryptText = async (encryptedBase64, secretPassword) => {
  if (!secretPassword) throw new Error('Vui lòng nhập mật khẩu riêng tư để giải mã ghi chú.');
  if (!encryptedBase64) return '';

  // Xử lý chuỗi mã hóa Fallback cơ bản
  if (encryptedBase64.startsWith('ENC_')) {
    try {
      const rawBase64 = encryptedBase64.replace('ENC_', '');
      return decodeURIComponent(escape(atob(rawBase64)));
    } catch {
      throw new Error('Dữ liệu ghi chú riêng tư bị hỏng.');
    }
  }

  try {
    // 1. Khôi phục payload từ Base64
    const jsonString = atob(encryptedBase64);
    const payload = JSON.parse(jsonString);

    const iv = new Uint8Array(base64ToBuffer(payload.iv));
    const ciphertext = base64ToBuffer(payload.ciphertext);
    const salt = 'noteapp_private_salt_2026';

    // 2. Tạo lại khóa giải mã từ mật khẩu
    const key = await deriveKey(secretPassword, salt);

    // 3. Thực hiện giải mã AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return bufferToText(decryptedBuffer);
  } catch (error) {
    console.error('Lỗi giải mã dữ liệu (Mật khẩu có thể không đúng):', error);
    throw new Error('Mật khẩu giải mã không chính xác hoặc dữ liệu bị hỏng.');
  }
};
