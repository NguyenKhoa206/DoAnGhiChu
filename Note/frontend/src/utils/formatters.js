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
