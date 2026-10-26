/** Display time zones. Stored records always use Colombo (+05:30). */

export const STORAGE_TIME_ZONE = 'Asia/Colombo';
export const STORAGE_TIME_ZONE_LABEL = 'Colombo, Sri Lanka';
const STORAGE_KEY = 'hr-view-timezone';

export const VIEW_TIME_ZONES = [
  { id: 'Asia/Colombo', city: 'Colombo, Sri Lanka', region: 'Sri Lanka' },
  { id: 'Australia/Sydney', city: 'Sydney', region: 'Australia' },
  { id: 'Australia/Melbourne', city: 'Melbourne', region: 'Australia' },
  { id: 'America/Chicago', city: 'Texas', region: 'United States' },
  { id: 'Asia/Singapore', city: 'Singapore', region: 'Singapore' },
  { id: 'Asia/Kuala_Lumpur', city: 'Malaysia', region: 'Malaysia' },
  { id: 'Australia/Perth', city: 'Perth', region: 'Australia' },
  { id: 'Australia/Adelaide', city: 'Adelaide', region: 'Australia' },
  { id: 'Africa/Johannesburg', city: 'Durban', region: 'South Africa' },
  { id: 'Asia/Dubai', city: 'Dubai', region: 'United Arab Emirates' },
  { id: 'America/New_York', city: 'New York', region: 'United States' },
  { id: 'Asia/Dhaka', city: 'Dhaka', region: 'Bangladesh' },
  { id: 'Asia/Karachi', city: 'Rawalpindi', region: 'Pakistan' },
  { id: 'Asia/Karachi#Lahore', city: 'Lahore', region: 'Pakistan' },
  { id: 'Etc/UTC', city: 'Greenwich', region: 'GMT' },
];

const zoneById = new Map(VIEW_TIME_ZONES.map((zone) => [zone.id, zone]));

let activeZoneId = readStoredZone();

export function ianaZone(id = activeZoneId) {
  const zone = zoneById.get(id);
  const raw = zone?.id || STORAGE_TIME_ZONE;
  return raw.split('#')[0];
}

export function getViewTimeZone() {
  return activeZoneId;
}

export function getViewTimeZoneInfo() {
  return zoneById.get(activeZoneId) || zoneById.get(STORAGE_TIME_ZONE);
}

export function setActiveTimeZone(id) {
  activeZoneId = zoneById.has(id) ? id : STORAGE_TIME_ZONE;
  return activeZoneId;
}

export function readStoredZone() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (zoneById.has(saved)) return saved;
  } catch {
    /* ignore */
  }
  return STORAGE_TIME_ZONE;
}

export function persistTimeZone(id) {
  const next = setActiveTimeZone(id);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

function zoneOffsetMs(timeZone, utcMs) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const bag = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') bag[part.type] = part.value;
  });
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(Number(bag.year), Number(bag.month) - 1, Number(bag.day), hour, Number(bag.minute), Number(bag.second));
  return asUtc - utcMs;
}

/** Naive API timestamps are Colombo wall-clock times. A Date is an absolute instant. */
export function parseWallTime(value, timeZone = STORAGE_TIME_ZONE) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (!text) return null;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(text)) {
    const absolute = new Date(text);
    return Number.isNaN(absolute.getTime()) ? null : absolute;
  }
  const normalized = (text.includes('T') ? text : text.replace(' ', 'T')).replace(/\.\d+$/, '');
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);
  const second = Number(match[6] || 0);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const corrected = utcGuess - zoneOffsetMs(timeZone, utcGuess);
  return new Date(utcGuess - zoneOffsetMs(timeZone, corrected));
}

export function formatInZone(value, options, timeZone = ianaZone()) {
  const instant = parseWallTime(value);
  if (!instant) return '—';
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone }).format(instant);
}

export function formatWhen(value) {
  if (!value) return '—';
  const instant = parseWallTime(value);
  if (!instant) return String(value).replace('T', ' ');
  return formatInZone(instant, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
}

export function formatWhenParts(value) {
  const instant = parseWallTime(value);
  if (!instant) return null;
  const zone = ianaZone();
  return {
    date: formatInZone(instant, { year: 'numeric', month: 'short', day: '2-digit' }, zone),
    time: formatInZone(instant, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }, zone),
  };
}

export function formatClock(value, withSeconds = false) {
  if (!value) return '';
  const instant = parseWallTime(value);
  if (!instant) {
    const text = String(value);
    return text.length >= 16 ? text.slice(11, withSeconds ? 19 : 16) : text;
  }
  return formatInZone(instant, {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  });
}

export function formatBreakStamp(value) {
  const instant = parseWallTime(value);
  if (!instant) return '—';
  const zone = ianaZone();
  const time = formatInZone(instant, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }, zone);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (day === today) return time;
  const date = formatInZone(instant, { month: 'short', day: 'numeric' }, zone);
  return `${date} ${time}`;
}

export function formatGeneratedAt(date = new Date()) {
  return formatWhen(date instanceof Date ? date : new Date());
}

export function formatNowParts(date = new Date()) {
  const zone = ianaZone();
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
  return { time, date: day };
}

export function formatMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: ianaZone(), month: 'long' }).format(date);
}

/** Calendar dates stored as yyyy-MM-dd stay on that Colombo business day. */
export function formatCivilDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);
  const utc = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(utc);
}

export function colomboTodayIso(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORAGE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function colomboMonthValue(date = new Date()) {
  return colomboTodayIso(date).slice(0, 7);
}

/** Shift hours are stored as Colombo wall times. Show the same instant in the view zone. */
export function formatShiftClock(hhmm, spansNextDay = false) {
  if (!hhmm) return '';
  const match = String(hhmm).match(/^(\d{2}):(\d{2})/);
  if (!match) return String(hhmm);
  const today = colomboTodayIso();
  const [year, month, day] = today.split('-').map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  if (spansNextDay) anchor.setUTCDate(anchor.getUTCDate() + 1);
  const date = anchor.toISOString().slice(0, 10);
  const instant = parseWallTime(`${date}T${match[1]}:${match[2]}:00`);
  if (!instant) return String(hhmm).slice(0, 5);
  return formatInZone(instant, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

export function zoneOffsetLabel(id, date = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaZone(id),
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  }).formatToParts(date).find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  return name.replace('GMT', 'GMT ');
}
