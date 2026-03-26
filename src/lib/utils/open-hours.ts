import type { OpeningHours, DayHours } from '@/lib/types/toilet';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

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

/**
 * Format opening hours for display
 */
export function formatHours(hours: OpeningHours): string {
  if (!hours.raw) return '';

  // If all days have the same hours, show once
  const mon = hours.mon;
  if (mon) {
    const allSame = DAY_KEYS.slice(1, 6).every((day) => {
      const d = hours[day];
      return d && d.open === mon.open && d.close === mon.close;
    });

    if (allSame) {
      return `${mon.open}–${mon.close}`;
    }
  }

  return hours.raw;
}
