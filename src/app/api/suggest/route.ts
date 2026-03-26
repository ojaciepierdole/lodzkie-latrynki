import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/suggest
 *
 * Crowdsource endpoint for community toilet submissions (v1.1)
 * Rate limited: 5 submissions per hour per IP
 */

// Simple in-memory rate limiter (use Redis/KV in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }) // 1 hour
    return true
  }

  if (entry.count >= 5) {
    return false
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 hour.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.address || !body.name) {
      return NextResponse.json(
        { error: 'Address and name are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('community_submissions').insert({
      toilet_data: {
        name: body.name,
        address: body.address,
        type: body.type || 'free',
        accessible: body.accessible || false,
        description: body.notes || null,
        hours_raw: body.hours || null,
      },
      ip_hash: ip ? Buffer.from(ip).toString('base64').slice(0, 16) : null,
    })

    if (error) {
      console.error('[Suggest] Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Suggest] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}
