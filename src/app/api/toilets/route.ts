import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: toilets, error, count } = await supabase
    .from('toilets')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform DB column names back to camelCase for frontend compatibility
  const transformedData = (toilets || []).map(t => ({
    id: t.id,
    source: t.source,
    name: t.name,
    address: t.address,
    lat: t.lat,
    lng: t.lng,
    type: t.type,
    price: t.price,
    accessible: t.accessible,
    description: t.description,
    hours: t.hours,
    is24h: t.is24h,
    lastScraped: t.last_scraped,
    lastVerified: t.last_verified,
    status: t.status,
  }))

  const umlCount = transformedData.filter(t => t.source === 'uml').length
  const communityCount = transformedData.filter(t => t.source === 'community').length

  return NextResponse.json({
    data: transformedData,
    meta: {
      total: count || transformedData.length,
      lastUpdated: new Date().toISOString(),
      sources: { uml: umlCount, community: communityCount },
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
