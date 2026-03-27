/**
 * Import script for gdziejesttron.pl data into Supabase.
 *
 * Fetches accepted toilet records from gdziejesttron.pl API,
 * deduplicates against existing Supabase records (100m threshold),
 * and upserts new/enriched data into the multi-table schema.
 *
 * Run with: npm run import:gdziejesttron
 *           (or: npx tsx scripts/import-gdziejesttron.ts)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { createHash } from 'crypto'

dotenv.config({ path: '.env.local' })

// ---------------------------------------------------------------------------
// Supabase client (standalone, not the Next.js singleton)
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

// Prefer service role key (bypasses RLS) for write operations;
// fall back to anon key with a warning.
const supabaseKey = supabaseServiceKey || supabaseAnonKey
if (!supabaseKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}
if (!supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not set — using anon key.')
  console.warn('  Inserts may fail if RLS blocks writes. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.\n')
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GDZIEJESTTRON_API = 'https://gdziejesttron.pl/throne/list'

/** Bounding box for Lodz agglomeration */
const BBOX = {
  latMin: 51.58,
  latMax: 51.92,
  lngMin: 19.15,
  lngMax: 19.75,
}

/** Haversine distance threshold for deduplication (meters) */
const DEDUP_THRESHOLD_M = 100

/** Batch size for Supabase upserts */
const BATCH_SIZE = 50

// ---------------------------------------------------------------------------
// Types — gdziejesttron API response shapes
// ---------------------------------------------------------------------------

interface GdziejesttronRecord {
  id: number
  name: string
  description?: string | null
  address?: string
  lat: number
  lng: number
  state: string
  kind?: string
  parameters?: GdziejesttronParameter[]
  openByDays?: Record<string, { from: string; to: string }> | []
  images?: string[]
  opinions?: GdziejesttronOpinion[]
}

interface GdziejesttronParameter {
  id: number
  name: string
  icon?: string
}

interface GdziejesttronOpinion {
  id: number
  rating: number
  content?: string
  firstname?: string
  createDate?: string
  createTime?: string
}

interface ExistingToilet {
  id: string
  lat: number
  lng: number
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Haversine distance between two lat/lng points in meters.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Normalize a Polish address string: title-case parts, fix common typos.
 */
function normalizeAddress(addr: string): string {
  return addr
    .split(',')
    .map(part =>
      part
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase()),
    )
    .join(', ')
    .replace(/\bŁódz\b/g, 'Łódź')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Generate a deterministic ID for a gdziejesttron record.
 */
function makeId(sourceId: number): string {
  return `gdziejesttron-${sourceId}`
}

/**
 * Generate a UUID-like ID from content for reviews/images.
 */
function hashId(input: string): string {
  return createHash('md5').update(input).digest('hex')
}

// ---------------------------------------------------------------------------
// Mapping tables
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  'toaleta-publiczna': 'public',
  'gastronomia-i-inne-uslugi': 'commercial',
  'kultura': 'cultural',
  'administracja-publiczna': 'government',
}

const FEATURE_MAP: Record<string, string> = {
  'Damska': 'female',
  'Męska': 'male',
  'Neutralna': 'neutral',
  'Przewijak': 'changing_table',
  'Przyjazna dzieciom': 'child_friendly',
  'Muszla porcelanowa': 'porcelain',
  'Dostępne środki higieniczne': 'hygiene_supplies',
}

const DAY_MAP: Record<string, string> = {
  '1': 'mon',
  '2': 'tue',
  '3': 'wed',
  '4': 'thu',
  '5': 'fri',
  '6': 'sat',
  '7': 'sun',
}

// ---------------------------------------------------------------------------
// Step 1: Fetch gdziejesttron data
// ---------------------------------------------------------------------------

async function fetchGdziejesttron(): Promise<GdziejesttronRecord[]> {
  console.log('Fetching data from gdziejesttron.pl...')
  const res = await fetch(GDZIEJESTTRON_API, {
    headers: {
      'User-Agent': 'wcgo.pl/1.0 (+https://wcgo.pl)',
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`gdziejesttron API returned ${res.status}: ${res.statusText}`)
  }

  const data: GdziejesttronRecord[] = await res.json()
  console.log(`  Received ${data.length} total records from API`)

  // Filter: accepted state + within Lodz bounding box
  const filtered = data.filter(
    r =>
      r.state === 'accepted' &&
      r.lat >= BBOX.latMin &&
      r.lat <= BBOX.latMax &&
      r.lng >= BBOX.lngMin &&
      r.lng <= BBOX.lngMax,
  )

  console.log(`  Filtered to ${filtered.length} accepted records within Lodz bbox`)
  return filtered
}

// ---------------------------------------------------------------------------
// Step 2: Fetch existing toilets from Supabase
// ---------------------------------------------------------------------------

async function fetchExistingToilets(): Promise<ExistingToilet[]> {
  console.log('Fetching existing toilets from Supabase...')
  const { data, error } = await supabase
    .from('toilets')
    .select('id, lat, lng')

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`)
  }

  console.log(`  Found ${data.length} existing toilets in Supabase`)
  return data as ExistingToilet[]
}

// ---------------------------------------------------------------------------
// Step 3: Deduplicate
// ---------------------------------------------------------------------------

interface DeduplicationResult {
  newRecords: GdziejesttronRecord[]
  overlaps: Array<{ record: GdziejesttronRecord; existingId: string; distance: number }>
}

function deduplicate(
  incoming: GdziejesttronRecord[],
  existing: ExistingToilet[],
): DeduplicationResult {
  console.log('Deduplicating records...')
  const newRecords: GdziejesttronRecord[] = []
  const overlaps: DeduplicationResult['overlaps'] = []

  for (const record of incoming) {
    let closestExisting: ExistingToilet | null = null
    let closestDistance = Infinity

    for (const ex of existing) {
      const dist = haversineDistance(record.lat, record.lng, ex.lat, ex.lng)
      if (dist < closestDistance) {
        closestDistance = dist
        closestExisting = ex
      }
    }

    if (closestExisting && closestDistance < DEDUP_THRESHOLD_M) {
      overlaps.push({
        record,
        existingId: closestExisting.id,
        distance: Math.round(closestDistance),
      })
    } else {
      newRecords.push(record)
    }
  }

  console.log(`  New: ${newRecords.length}, Overlap (<${DEDUP_THRESHOLD_M}m): ${overlaps.length}`)
  return { newRecords, overlaps }
}

// ---------------------------------------------------------------------------
// Step 4: Transform records
// ---------------------------------------------------------------------------

interface TransformedToilet {
  id: string
  source: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
  price: string | null
  accessible: boolean
  description: string | null
  hours: Record<string, unknown>
  is24h: boolean
  category: string | null
  status: string
  last_scraped: string
}

interface TransformedFeature {
  toilet_id: string
  feature: string
}

interface TransformedHour {
  toilet_id: string
  day_of_week: number
  open_time: string
  close_time: string
}

interface TransformedImage {
  id: string
  toilet_id: string
  url: string
  source: string
}

interface TransformedReview {
  id: string
  toilet_id: string
  rating: number
  text: string | null
  author_name: string
  is_mock: boolean
  created_at: string
}

interface TransformedSource {
  toilet_id: string
  source: string
  source_id: string
  last_synced_at: string
  confidence: number
  raw_data: unknown
}

function extractFeatures(params: GdziejesttronParameter[] | undefined): {
  features: string[]
  accessible: boolean
  isPaid: boolean
} {
  const features: string[] = []
  let accessible = false
  let isPaid = false

  if (!params || params.length === 0) return { features, accessible, isPaid }

  for (const param of params) {
    const name = param.name
    if (name.includes('niepełnosprawn')) {
      accessible = true
    } else if (name === 'Płatna') {
      isPaid = true
    } else if (FEATURE_MAP[name]) {
      features.push(FEATURE_MAP[name])
    }
  }

  return { features, accessible, isPaid }
}

function buildHours(
  openByDays: Record<string, { from: string; to: string }> | [] | undefined,
): {
  hoursJson: Record<string, unknown>
  hourRows: Array<{ day_of_week: number; open_time: string; close_time: string }>
  is24h: boolean
  rawHours: string
} {
  const hoursJson: Record<string, unknown> = {}
  const hourRows: Array<{ day_of_week: number; open_time: string; close_time: string }> = []
  let is24h = false
  const rawParts: string[] = []

  // openByDays can be an empty array [] or an object — normalize
  if (!openByDays || Array.isArray(openByDays) || Object.keys(openByDays).length === 0) {
    return { hoursJson: { raw: '' }, hourRows: [], is24h: false, rawHours: '' }
  }

  const days = Object.keys(openByDays)

  // If only key "1" exists, expand to all 7 days
  const expandedDays: Record<string, { from: string; to: string }> = {}
  if (days.length === 1 && days[0] === '1') {
    for (let d = 1; d <= 7; d++) {
      expandedDays[String(d)] = openByDays['1']
    }
  } else {
    Object.assign(expandedDays, openByDays)
  }

  for (const [dayKey, times] of Object.entries(expandedDays)) {
    const dayName = DAY_MAP[dayKey]
    if (!dayName) continue

    const openTime = times.from || '00:00'
    const closeTime = times.to || '23:59'

    hoursJson[dayName] = { open: openTime, close: closeTime }
    hourRows.push({
      day_of_week: parseInt(dayKey),
      open_time: openTime,
      close_time: closeTime,
    })

    rawParts.push(`${openTime}-${closeTime}`)

    if (openTime === '00:00' && (closeTime === '23:59' || closeTime === '24:00')) {
      is24h = true
    }
  }

  // Deduplicate raw parts for display
  const uniqueRaw = [...new Set(rawParts)]
  const rawHours = uniqueRaw.join(', ')
  hoursJson.raw = rawHours

  return { hoursJson, hourRows, is24h, rawHours }
}

function transformRecord(record: GdziejesttronRecord): {
  toilet: TransformedToilet
  features: TransformedFeature[]
  hours: TransformedHour[]
  images: TransformedImage[]
  reviews: TransformedReview[]
  source: TransformedSource
} {
  const toiletId = makeId(record.id)
  const { features: featureNames, accessible, isPaid } = extractFeatures(record.parameters)
  const { hoursJson, hourRows, is24h } = buildHours(record.openByDays)

  const toilet: TransformedToilet = {
    id: toiletId,
    source: 'gdziejesttron',
    name: record.name || 'Toaleta',
    address: normalizeAddress(record.address || ''),
    lat: record.lat,
    lng: record.lng,
    type: isPaid ? 'paid' : 'free',
    price: null,
    accessible,
    description: record.description ?? null,
    hours: hoursJson,
    is24h,
    category: record.kind ? (CATEGORY_MAP[record.kind] || null) : null,
    status: 'active',
    last_scraped: new Date().toISOString(),
  }

  const features: TransformedFeature[] = featureNames.map(f => ({
    toilet_id: toiletId,
    feature: f,
  }))

  const hours: TransformedHour[] = hourRows.map(h => ({
    toilet_id: toiletId,
    ...h,
  }))

  const images: TransformedImage[] = (record.images || []).map(img => ({
    id: hashId(`${toiletId}-${img}`),
    toilet_id: toiletId,
    url: img.startsWith('http') ? img : `https://gdziejesttron.pl${img}`,
    source: 'gdziejesttron',
  }))

  const reviews: TransformedReview[] = (record.opinions || []).map(op => {
    // Parse "DD.MM.YYYY" + "HH:MM" into ISO string
    let createdAt = new Date().toISOString()
    if (op.createDate) {
      const [day, month, year] = op.createDate.split('.')
      const time = op.createTime || '00:00'
      createdAt = new Date(`${year}-${month}-${day}T${time}:00Z`).toISOString()
    }
    return {
      id: hashId(`gdziejesttron-review-${op.id}`),
      toilet_id: toiletId,
      rating: Math.min(5, Math.max(1, op.rating || 3)),
      text: op.content || null,
      author_name: op.firstname || 'Anonim',
      is_mock: false,
      created_at: createdAt,
    }
  })

  const source: TransformedSource = {
    toilet_id: toiletId,
    source: 'gdziejesttron',
    source_id: String(record.id),
    last_synced_at: new Date().toISOString(),
    confidence: 0.80,
    raw_data: record,
  }

  return { toilet, features, hours, images, reviews, source }
}

// ---------------------------------------------------------------------------
// Step 5: Insert into Supabase
// ---------------------------------------------------------------------------

/** Insert items in batches, returning count of successes and collecting errors. */
async function batchUpsert(
  table: string,
  rows: Record<string, unknown>[],
  onConflict?: string,
): Promise<{ inserted: number; errors: string[] }> {
  let inserted = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const query = onConflict
      ? supabase.from(table).upsert(batch, { onConflict })
      : supabase.from(table).upsert(batch, { onConflict: 'id' })

    const { error } = await query

    if (error) {
      errors.push(`${table} batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`)
    } else {
      inserted += batch.length
    }
  }

  return { inserted, errors }
}

async function insertNewRecords(
  records: GdziejesttronRecord[],
): Promise<{
  toilets: number
  features: number
  hours: number
  images: number
  reviews: number
  sources: number
  errors: string[]
}> {
  const allToilets: Record<string, unknown>[] = []
  const allFeatures: Record<string, unknown>[] = []
  const allHours: Record<string, unknown>[] = []
  const allImages: Record<string, unknown>[] = []
  const allReviews: Record<string, unknown>[] = []
  const allSources: Record<string, unknown>[] = []
  const errors: string[] = []

  for (const record of records) {
    try {
      const { toilet, features, hours, images, reviews, source } = transformRecord(record)
      allToilets.push(toilet as unknown as Record<string, unknown>)
      allFeatures.push(...(features as unknown as Record<string, unknown>[]))
      allHours.push(...(hours as unknown as Record<string, unknown>[]))
      allImages.push(...(images as unknown as Record<string, unknown>[]))
      allReviews.push(...(reviews as unknown as Record<string, unknown>[]))
      allSources.push(source as unknown as Record<string, unknown>)
    } catch (err) {
      errors.push(`Transform error for record ${record.id}: ${String(err)}`)
    }
  }

  console.log('Inserting new records into Supabase...')

  const toiletResult = await batchUpsert('toilets', allToilets, 'id')
  errors.push(...toiletResult.errors)

  const featureResult = allFeatures.length > 0
    ? await batchUpsert('toilet_features', allFeatures, 'toilet_id,feature')
    : { inserted: 0, errors: [] }
  errors.push(...featureResult.errors)

  const hoursResult = allHours.length > 0
    ? await batchUpsert('toilet_hours', allHours, 'toilet_id,day_of_week')
    : { inserted: 0, errors: [] }
  errors.push(...hoursResult.errors)

  const imageResult = allImages.length > 0
    ? await batchUpsert('toilet_images', allImages, 'id')
    : { inserted: 0, errors: [] }
  errors.push(...imageResult.errors)

  const reviewResult = allReviews.length > 0
    ? await batchUpsert('reviews', allReviews, 'id')
    : { inserted: 0, errors: [] }
  errors.push(...reviewResult.errors)

  const sourceResult = allSources.length > 0
    ? await batchUpsert('toilet_sources', allSources, 'toilet_id,source')
    : { inserted: 0, errors: [] }
  errors.push(...sourceResult.errors)

  return {
    toilets: toiletResult.inserted,
    features: featureResult.inserted,
    hours: hoursResult.inserted,
    images: imageResult.inserted,
    reviews: reviewResult.inserted,
    sources: sourceResult.inserted,
    errors,
  }
}

async function enrichOverlaps(
  overlaps: DeduplicationResult['overlaps'],
): Promise<{
  sources: number
  features: number
  hours: number
  images: number
  reviews: number
  errors: string[]
}> {
  const allFeatures: Record<string, unknown>[] = []
  const allHours: Record<string, unknown>[] = []
  const allImages: Record<string, unknown>[] = []
  const allReviews: Record<string, unknown>[] = []
  const allSources: Record<string, unknown>[] = []
  const errors: string[] = []

  for (const { record, existingId, distance } of overlaps) {
    try {
      const { features, hours, images, reviews } = transformRecord(record)
      console.log(`  Enriching ${existingId} (overlap ${distance}m with gdziejesttron-${record.id})`)

      // Add gdziejesttron as secondary source on the EXISTING toilet
      allSources.push({
        toilet_id: existingId,
        source: 'gdziejesttron',
        source_id: String(record.id),
        last_synced_at: new Date().toISOString(),
        confidence: 0.80,
        raw_data: record,
      })

      // Remap features/hours/images/reviews to the existing toilet ID
      for (const f of features) {
        allFeatures.push({ toilet_id: existingId, feature: f.feature })
      }
      for (const h of hours) {
        allHours.push({
          toilet_id: existingId,
          day_of_week: h.day_of_week,
          open_time: h.open_time,
          close_time: h.close_time,
        })
      }
      for (const img of images) {
        allImages.push({
          id: hashId(`${existingId}-${img.url}`),
          toilet_id: existingId,
          url: img.url,
          source: 'gdziejesttron',
        })
      }
      for (const rev of reviews) {
        allReviews.push({
          ...rev,
          toilet_id: existingId,
          id: hashId(`gdziejesttron-review-${existingId}-${rev.id}`),
        })
      }
    } catch (err) {
      errors.push(`Enrichment error for overlap ${existingId}: ${String(err)}`)
    }
  }

  console.log('Enriching overlapping records in Supabase...')

  const sourceResult = allSources.length > 0
    ? await batchUpsert('toilet_sources', allSources, 'toilet_id,source')
    : { inserted: 0, errors: [] }
  errors.push(...sourceResult.errors)

  // Features: ignore conflict (only add new features, skip existing)
  const featureResult = allFeatures.length > 0
    ? await batchUpsert('toilet_features', allFeatures, 'toilet_id,feature')
    : { inserted: 0, errors: [] }
  errors.push(...featureResult.errors)

  // Hours: only insert if not already present (upsert on PK will update, which is acceptable)
  const hoursResult = allHours.length > 0
    ? await batchUpsert('toilet_hours', allHours, 'toilet_id,day_of_week')
    : { inserted: 0, errors: [] }
  errors.push(...hoursResult.errors)

  const imageResult = allImages.length > 0
    ? await batchUpsert('toilet_images', allImages, 'id')
    : { inserted: 0, errors: [] }
  errors.push(...imageResult.errors)

  const reviewResult = allReviews.length > 0
    ? await batchUpsert('reviews', allReviews, 'id')
    : { inserted: 0, errors: [] }
  errors.push(...reviewResult.errors)

  return {
    sources: sourceResult.inserted,
    features: featureResult.inserted,
    hours: hoursResult.inserted,
    images: imageResult.inserted,
    reviews: reviewResult.inserted,
    errors,
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== gdziejesttron.pl -> Supabase import ===\n')

  // Step 1: Fetch
  const incoming = await fetchGdziejesttron()

  // Step 2: Existing toilets
  const existing = await fetchExistingToilets()

  // Step 3: Deduplicate
  const { newRecords, overlaps } = deduplicate(incoming, existing)

  // Step 4 + 5: Insert new records
  const newResult = await insertNewRecords(newRecords)

  // Step 5b: Enrich overlaps
  const overlapResult = await enrichOverlaps(overlaps)

  // Step 6: Report
  const allErrors = [...newResult.errors, ...overlapResult.errors]

  console.log('\n=== Import complete ===')
  console.log(`  Fetched:  ${incoming.length} from gdziejesttron (aglomeracja lodzka)`)
  console.log(`  New:      ${newResult.toilets} toilets inserted`)
  console.log(`  Overlap:  ${overlaps.length} toilets enriched`)
  console.log(`  Features: ${newResult.features + overlapResult.features} feature rows`)
  console.log(`  Hours:    ${newResult.hours + overlapResult.hours} hour records`)
  console.log(`  Images:   ${newResult.images + overlapResult.images} image records`)
  console.log(`  Reviews:  ${newResult.reviews + overlapResult.reviews} review records`)
  console.log(`  Sources:  ${newResult.sources + overlapResult.sources} source rows`)

  if (allErrors.length > 0) {
    console.log(`\n  Errors (${allErrors.length}):`)
    for (const err of allErrors) {
      console.log(`    - ${err}`)
    }
    process.exit(1)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Import failed:', err)
  process.exit(1)
})
