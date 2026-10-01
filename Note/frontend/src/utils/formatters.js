    /**
 * Utility chứa các hàm định dạng dữ liệu (Formatting Helpers)
 */

/**
 * Định dạng chuỗi ngày tháng ISO sang chuỗi định dạng Tiếng Việt dễ đọc
 * @param {string|Date} dateInput - Chuỗi thời gian ISO (VD: "2026-09-10T08:00:00Z")
 * @param {boolean} showTime - Có hiển thị giờ phút hay không (Mặc định: true)
 * @returns {string} Chuỗi hiển thị (VD: "15:30, 20/09/2026")
 */
export const formatDate = (dateInput, showTime = true) => {
  if (!dateInput) return 'N/A';

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!showTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Chuyển đổi tên Chủ đề tiếng Việt có dấu thành chuỗi Slug chuẩn tên file .json
 * Ví dụ: "Học tập & Ý tưởng" -> "hoc-tap-y-tuong" (Tương ứng file hoc-tap-y-tuong.json)
 * @param {string} text - Tên chủ đề nguyên bản
 * @returns {string} Chuỗi slug an toàn cho đường dẫn/tên file
 */
export const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Tách các dấu thanh ra khỏi ký tự gốc
    .replace(/[\u0300-\u036f]/g, '') // Xóa các dấu thanh tiếng Việt
    .replace(/[đĐ]/g, 'd') // Chuyển đ/Đ thành d
    .replace(/[^a-z0-9 -]/g, '') // Xóa các ký tự đặc biệt
    .replace(/\s+/g, '-') // Thay thế khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, '-'); // Xóa các dấu gạch ngang bị trùng lặp
};

/**
 * Rút gọn chuỗi văn bản nếu vượt quá độ dài tối đa (Thêm dấu ...)
 * @param {string} text - Chuỗi gốc
 * @param {number} maxLength - Độ dài tối đa (Mặc định: 100)
 * @returns {string} Chuỗi đã được cắt ngắn
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * In hoa chữ cái đầu tiên của chuỗi
 * @param {string} str - Chuỗi vào
 * @returns {string}
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
