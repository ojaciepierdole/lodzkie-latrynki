import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { createHash } from 'crypto';
import type { Toilet, OpeningHours } from '@/lib/types/toilet';

const UML_BASE_URL =
  'https://uml.lodz.pl/dla-mieszkancow/toalety-miejskie/';

interface RawToilet {
  uid: string;
  name: string;
  description: string;
  hours: string;
  type: string;
  accessible: string;
}

/**
 * Generate a deterministic ID from register-element UID or toilet name
 */
function generateId(uid: string, name: string): string {
  if (uid) return `uml-${uid}`;
  return createHash('md5').update(name.toLowerCase().trim()).digest('hex').slice(0, 12);
}

/**
 * Parse "platna 2 zl" -> { type: 'paid', price: '2 zl' }
 */
function parseType(raw: string): { type: 'free' | 'paid'; price?: string } {
  const lower = raw.toLowerCase().trim();
  if (lower.includes('bezpłatn') || lower.includes('nieodpłatn')) {
    return { type: 'free' };
  }
  const priceMatch = lower.match(/(\d+\s*(?:,\d+)?\s*zł)/);
  if (priceMatch) {
    return { type: 'paid', price: priceMatch[1] };
  }
  if (lower.includes('płatn')) {
    return { type: 'paid' };
  }
  // No price keywords found — default to free (toi-toi, park cabins, etc.)
  return { type: 'free' };
}

/**
 * Parse raw hours string into OpeningHours
 * Handles formats like: "7:00-16:30", "24h", "sezonowo", etc.
 */
function parseHours(raw: string): { hours: OpeningHours; is24h: boolean } {
  const cleaned = raw.trim();
  const lower = cleaned.toLowerCase();
  const is24h = lower.includes('24') || lower.includes('całodobow') || lower.includes('calodobow');

  const timeMatch = cleaned.match(/(\d{1,2})[:.:](\d{2})\s*[-–]\s*(\d{1,2})[:.:](\d{2})/);

  if (is24h) {
    const allDay = { open: '00:00', close: '23:59' };
    return {
      hours: {
        mon: allDay, tue: allDay, wed: allDay, thu: allDay,
        fri: allDay, sat: allDay, sun: allDay,
        raw: cleaned,
      },
      is24h: true,
    };
  }

  if (timeMatch) {
    const dayHours = {
      open: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
      close: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
    };
    return {
      hours: {
        mon: dayHours, tue: dayHours, wed: dayHours, thu: dayHours,
        fri: dayHours, sat: dayHours, sun: dayHours,
        raw: cleaned,
      },
      is24h: false,
    };
  }

  // Unparseable — store raw text only
  return {
    hours: { raw: cleaned },
    is24h: false,
  };
}

/**
 * Parse accessible field: "tak" -> true
 */
function parseAccessible(raw: string): boolean {
  return raw.toLowerCase().trim().startsWith('tak');
}

/**
 * Extract text from a table cell, unwrapping inner divs if present.
 * Handles cells with <div class="registers-field-html"> wrappers.
 */
function cellText($: cheerio.CheerioAPI, cell: Element): string {
  const $cell = $(cell);
  const innerDiv = $cell.find('.registers-field-html');
  if (innerDiv.length > 0) {
    return innerDiv.text().trim();
  }
  return $cell.text().trim();
}

/**
 * Scrape the UML toilet register page
 */
async function scrapePage(): Promise<RawToilet[]> {
  const res = await fetch(UML_BASE_URL, {
    headers: {
      'User-Agent': 'wcgo.pl/1.0 (+https://wcgo.pl)',
      Accept: 'text/html',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`UML fetch failed: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const toilets: RawToilet[] = [];

  // Primary selector: table with specific id
  // Fallback: any striped+bordered table
  let rows = $('table#register-results-1562 tbody tr[id^="register-element-"]');
  if (rows.length === 0) {
    rows = $('table.table--striped tbody tr[id^="register-element-"]');
  }
  if (rows.length === 0) {
    rows = $('table.table--striped.table--bordered tbody tr');
  }

  rows.each((_i, row) => {
    const $row = $(row);
    const cells = $row.find('td').toArray();

    // Need at least 5 data cells (lokalizacja, opis, godziny, typ, niepelnosprawni)
    if (cells.length < 5) return;

    const name = cellText($, cells[0]);
    if (!name) return;

    const description = cellText($, cells[1]);
    const hours = cellText($, cells[2]);
    const type = cellText($, cells[3]);
    const accessible = cellText($, cells[4]);

    // Extract UID from tr[id] attribute or from the "Pokaz na mapie" link
    let uid = '';
    const trId = $row.attr('id') || '';
    const trIdMatch = trId.match(/register-element-(\d+)/);
    if (trIdMatch) {
      uid = trIdMatch[1];
    } else {
      const mapLink = $row.find('a[data-register-element-uid]');
      if (mapLink.length > 0) {
        uid = mapLink.attr('data-register-element-uid') || '';
      }
    }

    toilets.push({
      uid,
      name,
      description,
      hours,
      type,
      accessible,
    });
  });

  return toilets;
}

/**
 * Scrape all toilets from the UML register
 */
export async function scrapeAllToilets(): Promise<Toilet[]> {
  // All entries are on a single page — no pagination needed
  // Rate limiting delay kept for politeness
  await new Promise((r) => setTimeout(r, 1000));

  const allRaw = await scrapePage();

  // Safety: if we got nothing, return empty rather than error
  if (allRaw.length === 0) {
    console.warn('[UML Parser] No toilet entries found — page structure may have changed');
    return [];
  }

  // Deduplicate by name
  const seen = new Set<string>();
  const unique = allRaw.filter((t) => {
    const key = t.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Convert to Toilet type (without geocoding — that's separate)
  return unique.map((raw) => {
    const { type, price } = parseType(raw.type || raw.description);
    const { hours, is24h } = parseHours(raw.hours);

    return {
      id: generateId(raw.uid, raw.name),
      source: 'uml' as const,
      name: raw.name,
      address: raw.name, // UML uses location name as primary identifier
      lat: 0,
      lng: 0,
      type,
      price,
      accessible: parseAccessible(raw.accessible),
      description: raw.description || undefined,
      hours,
      is24h,
      lastScraped: new Date().toISOString(),
      status: 'active' as const,
    };
  });
}
