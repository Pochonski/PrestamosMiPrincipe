const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
});

const crcCompactFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('es-CR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateShortFormatter = new Intl.DateTimeFormat('es-CR', {
  day: '2-digit',
  month: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('es-CR', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('es-CR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatCRC(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '₡0';
  return crcFormatter.format(Number(n));
}

export function formatCRCCompact(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '₡0';
  return crcCompactFormatter.format(Number(n));
}

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const datePart = value.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [y, m, d] = datePart.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
  }
  return new Date(value);
}

export function formatMontoLive(v) {
  const digits = String(v || '').replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-CR') : '';
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '—';
  return dateFormatter.format(d);
}

export function formatDateShort(value) {
  const d = toDate(value);
  if (!d) return '—';
  return dateShortFormatter.format(d);
}

export function formatTime(value) {
  const d = toDate(value);
  if (!d) return '—';
  return timeFormatter.format(d);
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return '—';
  return dateTimeFormatter.format(d);
}

export function formatPhoneCR(value) {
  if (!value) return '—';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length !== 8) return value;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function diffDays(a, b = new Date()) {
  const ms = startOfDay(toDate(a)) - startOfDay(toDate(b));
  return Math.round(ms / 86400000);
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}