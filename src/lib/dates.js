// Small date helpers. All calendar dates are stored as 'YYYY-MM-DD' strings.

export const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toKey(new Date());

export const addDays = (key, n) => {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export const formatLong = (key) => {
  const d = fromKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const formatShort = (key) => {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
};

export const formatTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
};

export const isValidTime = (t) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);

export const weeksBetween = (fromKeyStr, toKeyStr) => {
  const ms = fromKey(toKeyStr) - fromKey(fromKeyStr);
  return Math.max(1, Math.round(ms / (7 * 24 * 3600 * 1000)));
};

// Grid of date keys for a month view (starts on Monday), 6 rows x 7 cols.
export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  let startOffset = first.getDay() - 1; // Monday-first
  if (startOffset < 0) startOffset = 6;
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    cells.push({ key: toKey(d), inMonth: d.getMonth() === month, day: d.getDate() });
  }
  return cells;
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
