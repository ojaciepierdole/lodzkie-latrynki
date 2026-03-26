import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Rate limiting: 3 reviews/hour/IP
const reviewRateMap = new Map<string, number[]>()

export async function GET(request: NextRequest) {
  const toiletId = request.nextUrl.searchParams.get('toiletId')

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  if (toiletId) {
    query = query.eq('toilet_id', toiletId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[Reviews] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform to camelCase for frontend
  const reviews = (data || []).map(r => ({
    id: r.id,
    toiletId: r.toilet_id,
    rating: r.rating,
    text: r.text,
    authorName: r.author_name,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
    isMock: r.is_mock,
  }))

  return NextResponse.json(reviews, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const hourAgo = now - 3600000
  const timestamps = (reviewRateMap.get(ip) || []).filter(t => t > hourAgo)

  if (timestamps.length >= 3) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again in 1 hour.' }, { status: 429 })
  }

  try {
    const body = await request.json()

    if (!body.toiletId || !body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'toiletId and rating (1-5) are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('reviews').insert({
      toilet_id: body.toiletId,
      rating: body.rating,
      text: body.text || null,
      author_name: body.authorName || 'Anonim',
    }).select().single()

    if (error) {
      console.error('[Reviews] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    timestamps.push(now)
    reviewRateMap.set(ip, timestamps)

    return NextResponse.json({
      success: true,
      review: {
        id: data.id,
        toiletId: data.toilet_id,
        rating: data.rating,
        text: data.text,
        authorName: data.author_name,
        createdAt: data.created_at,
      }
    })
  } catch (error) {
    console.error('[Reviews] Error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
