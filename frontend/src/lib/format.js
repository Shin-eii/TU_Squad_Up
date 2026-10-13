const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');

export const baht = (amount) => `${Math.round(amount).toLocaleString('en-US')}฿`;

export const addHours = (date, hours) => new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const formatTime = (date) => `${pad(new Date(date).getHours())}:${pad(new Date(date).getMinutes())}`;

/** "Today", "Tomorrow", "Yesterday", or "Sat 17 Oct". */
export function dayLabel(date, now = new Date()) {
  const diff = Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "Today 16:00" — or "No date yet" for an unscheduled draft. */
export function formatWhen(date, now = new Date()) {
  if (!date) return 'No date yet';
  return `${dayLabel(date, now)} ${formatTime(date)}`;
}

// Conversions between Date and the values used by <input type="date|time|datetime-local">.
export const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const toDateTimeInput = (d) => `${toDateInput(d)}T${toTimeInput(d)}`;

export function fromDateAndTime(date, time) {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fromDateTimeInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const costTotal = (items) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
