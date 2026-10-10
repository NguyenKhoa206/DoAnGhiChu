import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalReminderInput, reminderInstant, isReminderDue, isReminderToday, formatReminder } from '../src/utils/noteReminders.js';

process.env.TZ = 'Asia/Ho_Chi_Minh';

test('local Vietnamese time is stored as a UTC instant, including dates crossing midnight', () => {
  assert.equal(reminderInstant('2026-10-11T00:05'), '2026-10-10T17:05:00.000Z');
  assert.equal(toLocalReminderInput('2026-10-10T17:05:00.000Z'), '2026-10-11T00:05');
  assert.equal(isReminderToday('2026-10-10T17:05:00.000Z', new Date('2026-10-11T10:00:00+07:00')), true);
  assert.equal(isReminderToday('2026-10-10T17:05:00.000Z', new Date('2026-10-10T10:00:00+07:00')), false);
});

test('editing note text preserves seconds, while an empty input clears the schedule', () => {
  const saved = '2026-10-10T05:01:42.321Z';
  assert.equal(reminderInstant(toLocalReminderInput(saved), saved), saved);
  assert.equal(reminderInstant('', saved), null);
  assert.equal(reminderInstant('2026-02-30T12:00'), undefined);
  assert.equal(toLocalReminderInput('invalid'), '');
  assert.equal(formatReminder(null), '');
});

test('only pending reminders at or before the current instant are due, including missed reminders', () => {
  const time = Date.parse('2026-10-10T05:00:00Z');
  const note = { reminderAt: new Date(time).toISOString(), reminderNotifiedAt: null };
  assert.equal(isReminderDue(note, time - 1), false);
  assert.equal(isReminderDue(note, time), true);
  assert.equal(isReminderDue(note, time + 600_000), true);
  assert.equal(isReminderDue({ ...note, reminderNotifiedAt: new Date(time).toISOString() }, time + 1), false);
  assert.equal(isReminderDue({ reminderAt: 'invalid' }, time), false);
  assert.equal(isReminderDue({ reminderAt: null }, time), false);
});
