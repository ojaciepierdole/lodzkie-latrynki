import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { OpeningHours, DayHours, ToiletFeature, ToiletCategory } from '@/lib/types/toilet'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DAY_MAP: Record<number, keyof Omit<OpeningHours, 'raw'>> = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  7: 'sun',
}

interface ToiletHourRow {
  day_of_week: number
  open_time: string
  close_time: string
}

/**
 * Build OpeningHours from normalized toilet_hours rows.
 * Falls back to the legacy JSONB `hours` column when no rows exist.
 */
function buildHoursFromNormalized(
  rows: ToiletHourRow[] | null,
  legacyHours: OpeningHours | null
): OpeningHours {
  if (!rows || rows.length === 0) {
    return legacyHours ?? { raw: '' }
  }

  const hours: OpeningHours = { raw: '' }
  const parts: string[] = []

  for (const row of rows) {
    const dayKey = DAY_MAP[row.day_of_week]
    if (!dayKey) continue

    const dayHours: DayHours = {
      open: row.open_time.slice(0, 5),   // "08:00:00" → "08:00"
      close: row.close_time.slice(0, 5),
    }
    hours[dayKey] = dayHours
    parts.push(`${dayKey} ${dayHours.open}-${dayHours.close}`)
  }

  hours.raw = parts.join(', ')
  return hours
}

export async function GET() {
  const { data: toilets, error, count } = await supabase
    .from('toilets')
    .select(`
      *,
      toilet_features (feature),
      toilet_hours (day_of_week, open_time, close_time),
      toilet_images (url, source)
    `, { count: 'exact' })
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform DB snake_case + nested relations to camelCase Toilet interface
  const transformedData = (toilets || []).map(t => ({
    id: t.id as string,
    source: t.source as 'uml' | 'gdziejesttron' | 'community',
    name: t.name as string,
    address: t.address as string,
    lat: t.lat as number,
    lng: t.lng as number,
    type: t.type as 'free' | 'paid',
    price: t.price as string | undefined,
    accessible: t.accessible as boolean,
    description: t.description as string | undefined,
    category: (t.category || 'public') as ToiletCategory,
    features: ((t.toilet_features as { feature: string }[] | null) || []).map(
      f => f.feature as ToiletFeature
    ),
    images: ((t.toilet_images as { url: string; source: string }[] | null) || []).map(
      i => i.url
    ),
    cabinCount: (t.cabin_count as number | null) || undefined,
    claimedBy: (t.claimed_by as string | null) || undefined,
    hours: buildHoursFromNormalized(
      t.toilet_hours as ToiletHourRow[] | null,
      t.hours as OpeningHours | null
    ),
    is24h: t.is24h as boolean,
    lastScraped: t.last_scraped as string,
    lastVerified: (t.last_verified as string | null) || undefined,
    status: t.status as 'active' | 'pending' | 'closed',
  }))

  return NextResponse.json({
    data: transformedData,
    meta: {
      total: count || transformedData.length,
      lastUpdated: new Date().toISOString(),
      sources: {
        uml: transformedData.filter(t => t.source === 'uml').length,
        gdziejesttron: transformedData.filter(t => t.source === 'gdziejesttron').length,
        community: transformedData.filter(t => t.source === 'community').length,
      },
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
