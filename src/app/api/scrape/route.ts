import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllToilets } from '@/lib/scraper/uml-parser';
import { geocodeBatch } from '@/lib/scraper/geocoder';

/**
 * POST /api/scrape
 *
 * Called by Vercel Cron daily at 00:03 UTC.
 * Scrapes UML toilet data, geocodes new addresses, and stores results.
 *
 * Protected by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Scraper] Starting UML toilet scrape...');

    // 1. Scrape HTML from UML
    const toilets = await scrapeAllToilets();
    console.log(`[Scraper] Parsed ${toilets.length} toilets from UML`);

    // 2. Geocode addresses that don't have coordinates
    const toGeocode = toilets
      .filter((t) => t.lat === 0 && t.lng === 0)
      .map((t) => ({ id: t.id, address: t.address }));

    if (toGeocode.length > 0) {
      console.log(`[Scraper] Geocoding ${toGeocode.length} addresses...`);
      const coords = await geocodeBatch(toGeocode);

      for (const toilet of toilets) {
        const coord = coords.get(toilet.id);
        if (coord) {
          toilet.lat = coord[0];
          toilet.lng = coord[1];
        }
      }
    }

    // 3. Store results
    // TODO: In production, save to Vercel Blob
    // await put('toilets.json', JSON.stringify({ data: toilets, meta: {...} }), {
    //   access: 'public',
    //   contentType: 'application/json',
    // });

    console.log(`[Scraper] Done. ${toilets.length} toilets processed.`);

    return NextResponse.json({
      success: true,
      count: toilets.length,
      geocoded: toGeocode.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Scraper] Error:', error);
    return NextResponse.json(
      { error: 'Scrape failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which sends GET requests)
export async function GET(request: NextRequest) {
  return POST(request);
}
