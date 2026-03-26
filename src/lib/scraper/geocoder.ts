const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'wcgo.pl/1.0 (+https://wcgo.pl)';

/**
 * Manual coordinate overrides for well-known Łódź locations.
 * Nominatim struggles with park names, cemeteries, and train stations.
 * Coordinates verified via Google Maps.
 */
const MANUAL_COORDS: Record<string, [number, number]> = {
  'al. g.palki - wojska polskiego': [51.7590, 19.4570],
  'cmentarz komunalny "szczecińska"': [51.8163, 19.3739],
  'cmentarz komunalny "szczecińska" - 2 lokalizacja': [51.8170, 19.3725],
  'cmentarz komunalny "szczecińska" - 3 lokalizacja': [51.8155, 19.3750],
  'cmentarz komunalnym "doły"': [51.7980, 19.4910],
  'cmentarz komunalnym "doły" - 2 lokalizacja': [51.7975, 19.4920],
  'cmentarz komunalnym "zarzew"': [51.7480, 19.5280],
  'cmentarz komunalnym "zarzew" - 2 lokalizacja': [51.7494, 19.5289],
  'dworzec łódź kaliska': [51.7578, 19.4306],
  'dworzec łódź fabryczna': [51.7680, 19.4620],
  'las łagiewnicki': [51.8335, 19.4993],
  'ogród botaniczny': [51.7530, 19.4340],
  'park 3 maja': [51.7560, 19.4470],
  'park helenów': [51.7750, 19.4850],
  'park im. a. mickiewicza': [51.7520, 19.4640],
  'park im. ks. j. poniatowskiego': [51.7480, 19.4560],
  'park im. łódzkich harcerek': [51.7440, 19.4420],
  'park im. marsz. j. piłsudskiego': [51.7610, 19.4590],
  'park im. roberta baden-powella': [51.7840, 19.4320],
  'park im. szarych szeregów': [51.7770, 19.4730],
  'park podolski': [51.7350, 19.4510],
  'park reymonta': [51.7630, 19.4380],
  'park staromiejski': [51.7730, 19.4500],
  'park widzewska górka': [51.7570, 19.5050],
  'plac niepodległości 7': [51.7710, 19.4520],
  'rondo inwalidów': [51.7606, 19.5376],
  'skwer im. a. margolis-edelman': [51.7690, 19.4530],
  'skwer ireny tuwim': [51.7643, 19.4459],
  'ul. piotrkowska 102/14u': [51.7630, 19.4560],
  'ul. piotrkowska 102/2u (lu, od 2011-12-31)': [51.7630, 19.4560],
  'ul. piotrkowska 102/8u': [51.7630, 19.4560],
  'ul. piotrkowska 102/9u': [51.7630, 19.4560],
  'ul. piotrkowska 113/11u': [51.7610, 19.4555],
  'ul. piotrkowska 137/3u': [51.7580, 19.4545],
  'ul. piotrkowska 153/1u': [51.7560, 19.4535],
  'ul. piotrkowska 41/1u': [51.7695, 19.4580],
  'ul. piotrkowska 67/10u': [51.7670, 19.4570],
  'ul. płk dr stanisława więckowskiego 1/15u': [51.7740, 19.4480],
  'ul. rydzowa-lniana': [51.7340, 19.4700],
  'ul. targowa': [51.7700, 19.4640],
  'uroczysko lublinek': [51.7190, 19.3850],
  'skwer wiedźmina': [51.7655, 19.4565],
};

// In-memory cache for geocoding results (persisted via toilet data)
const geocodeCache = new Map<string, [number, number]>();

/**
 * Clean UML address for better geocoding results.
 * Removes apartment/unit numbers, parenthetical notes, extra suffixes.
 */
function cleanAddress(raw: string): string[] {
  let addr = raw.trim();

  // Remove "- 2 lokalizacja", "- 3 lokalizacja" suffixes
  addr = addr.replace(/\s*-\s*\d+\s*lokalizacja$/i, '');

  // Remove parenthetical notes like "(LU, od 2011-12-31)"
  addr = addr.replace(/\s*\([^)]*\)\s*/g, '');

  // Remove unit/apartment suffix: "/14U", "/2U", "/8U", "/1U", etc.
  const withoutUnit = addr.replace(/\/\d+U?\s*$/i, '');

  // Replace "Komunalnym" with "Komunalny" (common typo in UML data)
  addr = addr.replace(/Komunalnym/g, 'Komunalny');
  const cleaned = withoutUnit.replace(/Komunalnym/g, 'Komunalny');

  // Build progressive query list (most specific → least)
  const queries = new Set<string>();

  // Full cleaned address
  queries.add(`${cleaned}, Łódź, Polska`);
  queries.add(`${cleaned}, Łódź`);

  // Without street number for parks/cemeteries
  if (addr !== cleaned) {
    queries.add(`${addr}, Łódź, Polska`);
  }

  // Try just the street name without number
  const streetOnly = cleaned.replace(/\s+\d+.*$/, '');
  if (streetOnly !== cleaned) {
    queries.add(`${streetOnly}, Łódź, Polska`);
  }

  // For named places (parks, cemeteries), try name + Łódź
  if (!cleaned.startsWith('ul.') && !cleaned.startsWith('al.')) {
    queries.add(`${cleaned} Łódź`);
    // Try with quotes removed
    const noQuotes = cleaned.replace(/[„""]/g, '');
    if (noQuotes !== cleaned) {
      queries.add(`${noQuotes}, Łódź, Polska`);
    }
  }

  return Array.from(queries);
}

/**
 * Geocode an address in Łódź using Nominatim (OpenStreetMap)
 * Rate limited: max 1 request per second
 */
export async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  const cacheKey = address.toLowerCase().trim();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Normalize quotes for lookup: all fancy quotes → ASCII "
  const normalizedKey = cacheKey
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2018\u2019\u201A\u201B„""]/g, '"')
    .replace(/['']/g, "'");

  // Check manual overrides first (instant, no API call)
  // Try original key, then normalized key
  const manualCoords = MANUAL_COORDS[cacheKey] || MANUAL_COORDS[normalizedKey];
  if (manualCoords) {
    geocodeCache.set(cacheKey, manualCoords);
    return manualCoords;
  }

  const queries = cleanAddress(address);

  for (const query of queries) {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '1',
        countrycodes: 'pl',
        viewbox: '19.30,51.85,19.60,51.65', // Łódź bounding box
        bounded: '1',
      });

      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!res.ok) continue;

      const data = await res.json();

      if (data.length > 0) {
        const coords: [number, number] = [
          parseFloat(data[0].lat),
          parseFloat(data[0].lon),
        ];
        geocodeCache.set(cacheKey, coords);
        return coords;
      }
    } catch (error) {
      console.error(`Geocoding failed for "${query}":`, error);
    }
  }

  console.warn(`Could not geocode: "${address}"`);
  return null;
}

/**
 * Geocode multiple addresses with rate limiting (1 req/s for Nominatim)
 */
export async function geocodeBatch(
  addresses: { id: string; address: string }[]
): Promise<Map<string, [number, number]>> {
  const results = new Map<string, [number, number]>();

  for (const { id, address } of addresses) {
    const coords = await geocodeAddress(address);
    if (coords) {
      results.set(id, coords);
    }
    // Nominatim rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1100));
  }

  return results;
}
