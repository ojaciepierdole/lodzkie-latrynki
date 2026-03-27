const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'wcgo.pl/1.0 (+https://wcgo.pl)';

/**
 * Manual coordinate overrides for well-known Łódź locations.
 * Nominatim struggles with park names, cemeteries, and train stations.
 * Coordinates verified via Google Maps.
 */
const MANUAL_COORDS: Record<string, [number, number]> = {
  // Verified 2026-03-27 via Nominatim + OSM Overpass cross-reference
  // 10 CRITICAL fixes (were >2km off), 9 MAJOR fixes (800m-2km off)
  'al. g.palki - wojska polskiego': [51.7908, 19.4878],    // was 51.759/19.457 (4.1km off!)
  'cmentarz komunalny "szczecińska"': [51.8163, 19.3739],
  'cmentarz komunalny "szczecińska" - 2 lokalizacja': [51.8170, 19.3725],
  'cmentarz komunalny "szczecińska" - 3 lokalizacja': [51.8155, 19.3750],
  'cmentarz komunalnym "doły"': [51.7870, 19.4860],        // was 51.798/19.491 (1.3km off)
  'cmentarz komunalnym "doły" - 2 lokalizacja': [51.7890, 19.4920],  // was 51.798 (945m off)
  'cmentarz komunalnym "zarzew"': [51.7480, 19.5280],
  'cmentarz komunalnym "zarzew" - 2 lokalizacja': [51.7494, 19.5289],
  'dworzec łódź kaliska': [51.7578, 19.4306],
  'dworzec łódź fabryczna': [51.7695, 19.4700],
  'las łagiewnicki': [51.8231, 19.4880],                    // was 51.8335/19.4993 (800m off)
  'ogród botaniczny': [51.7570, 19.4050],                   // was 51.753/19.434 (2.0km off!)
  'park 3 maja': [51.7691, 19.4915],                        // was 51.756/19.447 (3.4km off!)
  'park helenów': [51.7820, 19.4680],                       // was 51.775/19.485 (1.4km off)
  'park im. a. mickiewicza': [51.8052, 19.4472],            // was 51.752/19.464 (6.0km off!)
  'park im. ks. j. poniatowskiego': [51.7540, 19.4420],    // was 51.748/19.456 (1.2km off)
  'park im. łódzkich harcerek': [51.8222, 19.4392],         // was 51.744/19.442 (8.7km off!)
  'park im. marsz. j. piłsudskiego': [51.7540, 19.4200],   // Park na Zdrowiu, corrected
  'park im. roberta baden-powella': [51.7692, 19.5025],     // was 51.784/19.432 (5.1km off!)
  'park im. szarych szeregów': [51.7920, 19.4700],          // was 51.777/19.473 (1.7km off)
  'park podolski': [51.7418, 19.4963],                      // was 51.735/19.451 (3.2km off!)
  'park reymonta': [51.7449, 19.4641],                      // was 51.763/19.438 (2.7km off!)
  'park staromiejski': [51.7800, 19.4560],                   // was 51.773/19.450 (900m off)
  'park widzewska górka': [51.7570, 19.5240],               // was 51.757/19.505 (1.3km off)
  'plac niepodległości 7': [51.7397, 19.4647],              // was 51.771/19.452 (3.6km off!)
  'rondo inwalidów': [51.7606, 19.5376],
  'skwer im. a. margolis-edelman': [51.7730, 19.4630],      // was 51.769/19.453 (843m off)
  'skwer ireny tuwim': [51.7643, 19.4459],
  'ul. piotrkowska 102/14u': [51.7650, 19.4576],            // was 51.763/19.456 (248m off)
  'ul. piotrkowska 102/2u (lu, od 2011-12-31)': [51.7650, 19.4576],
  'ul. piotrkowska 102/8u': [51.7650, 19.4576],
  'ul. piotrkowska 102/9u': [51.7650, 19.4576],
  'ul. piotrkowska 113/11u': [51.7640, 19.4570],
  'ul. piotrkowska 137/3u': [51.7610, 19.4580],
  'ul. piotrkowska 153/1u': [51.7600, 19.4580],
  'ul. piotrkowska 41/1u': [51.7710, 19.4560],
  'ul. piotrkowska 67/10u': [51.7670, 19.4570],
  'ul. płk dr stanisława więckowskiego 1/15u': [51.7730, 19.4550],
  'ul. rydzowa-lniana': [51.7975, 19.3762],                 // was 51.734/19.470 (9.6km off!!!)
  'ul. targowa': [51.7620, 19.4720],                        // was 51.770/19.464 (700m off)
  'uroczysko lublinek': [51.7320, 19.3880],                 // was 51.719/19.385 (1.4km off)
  'skwer wiedźmina': [51.7650, 19.4610],
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

  // Fallback: Google Geocoding API (if key is configured)
  const googleKey = process.env.GOOGLE_GEOCODING_API_KEY;
  if (googleKey) {
    try {
      const googleQuery = `${address}, Łódź, Polska`;
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(googleQuery)}&key=${googleKey}&region=pl&language=pl`;
      const gRes = await fetch(googleUrl);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.status === 'OK' && gData.results?.length > 0) {
          const loc = gData.results[0].geometry.location;
          const coords: [number, number] = [loc.lat, loc.lng];
          // Verify within Łódź bounding box
          if (coords[0] >= 51.65 && coords[0] <= 51.88 && coords[1] >= 19.25 && coords[1] <= 19.60) {
            console.log(`[Google Geocoder] "${address}" → ${coords[0]}, ${coords[1]}`);
            geocodeCache.set(cacheKey, coords);
            return coords;
          }
        }
      }
    } catch (error) {
      console.error(`Google geocoding failed for "${address}":`, error);
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
