export const toLocalReminderInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const reminderInstant = (input, previous = null) => {
  if (!input) return null;
  // Do not truncate seconds of an existing schedule when editing only text.
  if (input === toLocalReminderInput(previous)) return previous;
  const date = new Date(input);
  return Number.isFinite(date.getTime()) && toLocalReminderInput(date) === input ? date.toISOString() : undefined;
};

export const formatReminder = (value) => value && Number.isFinite(new Date(value).getTime())
  ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '';

export const isReminderToday = (value, now = new Date()) => {
  const date = new Date(value);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

export const isReminderDue = (reminder, now = Date.now()) => Boolean(reminder.reminderAt && !reminder.reminderNotifiedAt
  && Number.isFinite(new Date(reminder.reminderAt).getTime()) && new Date(reminder.reminderAt).getTime() <= now);
