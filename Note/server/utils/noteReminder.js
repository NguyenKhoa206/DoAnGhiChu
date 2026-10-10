// Persist an instant in UTC; clients display it in the user's local timezone.
const normalizeReminder = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/);
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] || 0) > 59) return undefined;
  const day = new Date(`${match[1]}T00:00:00Z`);
  const instant = new Date(value);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== match[1] || !Number.isFinite(instant.getTime())) return undefined;
  return instant.toISOString();
};

const reminderError = (value, previous = null) => {
  const normalized = normalizeReminder(value);
  if (normalized === undefined) return 'Ngày giờ nhắc không hợp lệ. Vui lòng chọn đầy đủ ngày và giờ.';
  if (normalized && normalized !== previous && new Date(normalized).getTime() <= Date.now()) return 'Thời gian nhắc phải ở trong tương lai.';
  return '';
};

module.exports = { normalizeReminder, reminderError };
