import type { OpeningHours, DayHours } from '@/lib/types/toilet';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type DayKey = (typeof DAY_KEYS)[number];

/** Ordered mon-sun for display (ISO week order) */
const DISPLAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_NAMES: Record<string, Record<DayKey, string>> = {
  pl: { mon: 'pn', tue: 'wt', wed: 'śr', thu: 'czw', fri: 'pt', sat: 'sob', sun: 'nd' },
  en: { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' },
  de: { mon: 'Mo', tue: 'Di', wed: 'Mi', thu: 'Do', fri: 'Fr', sat: 'Sa', sun: 'So' },
  es: { mon: 'lun', tue: 'mar', wed: 'mi\u00e9', thu: 'jue', fri: 'vie', sat: 's\u00e1b', sun: 'dom' },
  uk: { mon: '\u043f\u043d', tue: '\u0432\u0442', wed: '\u0441\u0440', thu: '\u0447\u0442', fri: '\u043f\u0442', sat: '\u0441\u0431', sun: '\u043d\u0434' },
};

const EVERYDAY_LABEL: Record<string, string> = {
  pl: 'codziennie',
  en: 'daily',
  de: 't\u00e4glich',
  es: 'diario',
  uk: 'щодня',
};

/**
 * Check if a toilet is currently open based on its opening hours
 */
export function isOpenNow(hours: OpeningHours): boolean | null {
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const dayHours: DayHours | undefined = hours[dayKey];

  if (!dayHours) {
    // No hours info for today — unknown
    return null;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = dayHours.open.split(':').map(Number);
  const [closeH, closeM] = dayHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

/** Get localized day name */
function dayName(key: DayKey, locale: string): string {
  const names = DAY_NAMES[locale] ?? DAY_NAMES.pl;
  return names[key];
}

/** Check if two DayHours have the same open/close */
function sameHours(a: DayHours, b: DayHours): boolean {
  return a.open === b.open && a.close === b.close;
}

/** Format a time range */
function timeRange(h: DayHours): string {
  return `${h.open}\u2013${h.close}`;
}

/** Check if days form a consecutive run in DISPLAY_ORDER */
function isConsecutiveRun(days: DayKey[]): boolean {
  if (days.length <= 1) return true;
  for (let i = 1; i < days.length; i++) {
    const prevIdx = DISPLAY_ORDER.indexOf(days[i - 1]);
    const currIdx = DISPLAY_ORDER.indexOf(days[i]);
    if (currIdx !== prevIdx + 1) return false;
  }
  return true;
}

/** Format a group of days: consecutive -> "pn-pt", non-consecutive -> "wt, śr, pt" */
function formatDayGroup(days: DayKey[], locale: string): string {
  if (days.length === 7) return EVERYDAY_LABEL[locale] ?? EVERYDAY_LABEL.pl;
  if (days.length >= 2 && isConsecutiveRun(days)) {
    return `${dayName(days[0], locale)}\u2013${dayName(days[days.length - 1], locale)}`;
  }
  return days.map((d) => dayName(d, locale)).join(', ');
}

/**
 * Translate English day abbreviations in raw string to localized ones.
 */
function translateRaw(raw: string, locale: string): string {
  const names = DAY_NAMES[locale] ?? DAY_NAMES.pl;
  const enNames = DAY_NAMES.en;
  let result = raw;
  // Replace English abbreviations (case-insensitive) with localized ones
  for (const key of DISPLAY_ORDER) {
    const enName = enNames[key];
    // Match whole-word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${enName}\\b`, 'gi');
    result = result.replace(regex, names[key]);
  }
  return result;
}

/**
 * Infer opening hours from a toilet category when no explicit hours are available.
 */
export function inferHoursFromCategory(category: string): { is24h: boolean; hours?: OpeningHours } | null {
  switch (category) {
    case 'hospital':
    case 'gas_station':
      return { is24h: true };
    case 'transit':
      return { is24h: false, hours: buildUniformHours('05:00', '23:00') };
    case 'shopping':
      return { is24h: false, hours: buildWeekendHours('09:00', '21:00', '10:00', '20:00') };
    case 'library':
    case 'university':
      return { is24h: false, hours: buildWeekdayHours('09:00', '19:00') };
    case 'clinic':
      return { is24h: false, hours: buildWeekdayHours('07:00', '18:00') };
    case 'restaurant':
      return { is24h: false, hours: buildUniformHours('10:00', '22:00') };
    case 'park':
      return { is24h: false, hours: buildUniformHours('06:00', '22:00') };
    case 'cemetery':
      return { is24h: false, hours: buildUniformHours('07:00', '19:00') };
    default:
      return null;
  }
}

function buildUniformHours(open: string, close: string): OpeningHours {
  const day: DayHours = { open, close };
  return { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day, raw: '' };
}

function buildWeekdayHours(open: string, close: string): OpeningHours {
  const day: DayHours = { open, close };
  return { mon: day, tue: day, wed: day, thu: day, fri: day, raw: '' };
}

function buildWeekendHours(weekOpen: string, weekClose: string, weekendOpen: string, weekendClose: string): OpeningHours {
  const weekday: DayHours = { open: weekOpen, close: weekClose };
  const weekend: DayHours = { open: weekendOpen, close: weekendClose };
  return { mon: weekday, tue: weekday, wed: weekday, thu: weekday, fri: weekday, sat: weekend, sun: weekend, raw: '' };
}

/**
 * Format opening hours for display.
 *
 * @param hours - The opening hours data
 * @param locale - Locale code (pl, en, de, es, uk). Defaults to 'pl'.
 *
 * Smart formatting rules:
 * - All days same hours -> "08:00-13:00 (codziennie)"
 * - Mon-Fri same, weekend different -> "pn-pt 08:00-13:00, sob 10:00-14:00"
 * - Partial week, same hours -> "wt, sr, pt, sob 08:00-13:00"
 * - Different hours -> compact grouped list
 */
export function formatHours(hours: OpeningHours, locale: string = 'pl'): string {
  // Collect all days that have hours, in display order
  const entries: { day: DayKey; hours: DayHours }[] = [];
  for (const day of DISPLAY_ORDER) {
    const dh = hours[day];
    if (dh) entries.push({ day, hours: dh });
  }

  // No structured data — fall back to raw (translated)
  if (entries.length === 0) {
    if (!hours.raw) return '';
    return translateRaw(hours.raw, locale);
  }

  // Group consecutive days with the same hours
  const groups: { days: DayKey[]; hours: DayHours }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && sameHours(last.hours, entry.hours)) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], hours: entry.hours });
    }
  }

  // Single group covering all 7 days -> "08:00-13:00 (codziennie)"
  if (groups.length === 1 && groups[0].days.length === 7) {
    const everyday = EVERYDAY_LABEL[locale] ?? EVERYDAY_LABEL.pl;
    return `${timeRange(groups[0].hours)} (${everyday})`;
  }

  // Single group, partial week, same hours -> "wt, sr, pt 08:00-13:00"
  if (groups.length === 1) {
    const g = groups[0];
    return `${formatDayGroup(g.days, locale)} ${timeRange(g.hours)}`;
  }

  // Multiple groups -> "pn-pt 08:00-13:00, sob 10:00-14:00"
  return groups
    .map((g) => `${formatDayGroup(g.days, locale)} ${timeRange(g.hours)}`)
    .join(', ');
}
