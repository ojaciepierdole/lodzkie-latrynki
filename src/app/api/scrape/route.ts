import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllToilets } from '@/lib/scraper/uml-parser'
import { geocodeBatch } from '@/lib/scraper/geocoder'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/scrape
 *
 * Called by Vercel Cron daily at 00:03 UTC.
 * Scrapes UML toilet data, geocodes new addresses, and upserts into Supabase.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Scraper] Starting UML toilet scrape...')

    // 1. Scrape HTML from UML
    const toilets = await scrapeAllToilets()
    console.log(`[Scraper] Parsed ${toilets.length} toilets from UML`)

    // 2. Geocode addresses that don't have coordinates
    const toGeocode = toilets
      .filter((t) => t.lat === 0 && t.lng === 0)
      .map((t) => ({ id: t.id, address: t.address }))

    if (toGeocode.length > 0) {
      console.log(`[Scraper] Geocoding ${toGeocode.length} addresses...`)
      const coords = await geocodeBatch(toGeocode)

      for (const toilet of toilets) {
        const coord = coords.get(toilet.id)
        if (coord) {
          toilet.lat = coord[0]
          toilet.lng = coord[1]
        }
      }
    }

    // 3. Get toilets with admin_override to skip
    const { data: overridden } = await supabase
      .from('toilets')
      .select('id')
      .eq('admin_override', true)

    const overriddenIds = new Set((overridden || []).map(t => t.id))

    // 4. Get all current UML toilet IDs to detect removed ones
    const { data: existingUml } = await supabase
      .from('toilets')
      .select('id')
      .eq('source', 'uml')
      .eq('status', 'active')

    const scrapedIds = new Set(toilets.map(t => t.id))

    // 5. Upsert each scraped toilet (skip overridden)
    let upsertedCount = 0
    let skippedCount = 0

    for (const toilet of toilets) {
      if (overriddenIds.has(toilet.id)) {
        skippedCount++
        continue
      }

      const { error } = await supabase.from('toilets').upsert({
        id: toilet.id,
        source: 'uml',
        name: toilet.name,
        address: toilet.address,
        lat: toilet.lat || 0,
        lng: toilet.lng || 0,
        type: toilet.type,
        price: toilet.price || null,
        accessible: toilet.accessible,
        description: toilet.description || null,
        hours: toilet.hours,
        is24h: toilet.is24h,
        status: 'active',
        last_scraped: new Date().toISOString(),
        admin_override: false,
      }, { onConflict: 'id' })

      if (error) {
        console.error(`[Scraper] Upsert error for ${toilet.id}:`, error)
      } else {
        upsertedCount++
      }
    }

    // 6. Mark toilets not found in UML as 'closed' (if they were 'uml' source and not overridden)
    let closedCount = 0
    for (const existing of existingUml || []) {
      if (!scrapedIds.has(existing.id) && !overriddenIds.has(existing.id)) {
        await supabase
          .from('toilets')
          .update({ status: 'closed' })
          .eq('id', existing.id)
        closedCount++
      }
    }

    // 7. Log scrape run
    await supabase.from('scrape_logs').insert({
      source: 'uml',
      toilets_found: toilets.length,
      toilets_geocoded: toGeocode.length,
      toilets_upserted: upsertedCount,
      toilets_closed: closedCount,
      errors: null,
    })

    console.log(`[Scraper] Done. ${upsertedCount} upserted, ${skippedCount} skipped (admin override), ${closedCount} closed.`)

    return NextResponse.json({
      success: true,
      count: toilets.length,
      upserted: upsertedCount,
      skipped: skippedCount,
      closed: closedCount,
      geocoded: toGeocode.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Scraper] Error:', error)

    // Log failed scrape (best-effort, don't throw if this also fails)
    try {
      await supabase.from('scrape_logs').insert({
        source: 'uml',
        toilets_found: 0,
        toilets_geocoded: 0,
        toilets_upserted: 0,
        toilets_closed: 0,
        errors: String(error),
      })
    } catch {
      // ignore logging failure
    }

    return NextResponse.json(
      { error: 'Scrape failed', details: String(error) },
      { status: 500 }
    )
  }
}

// Also support GET for Vercel Cron (which sends GET requests)
export async function GET(request: NextRequest) {
  return POST(request)
}
