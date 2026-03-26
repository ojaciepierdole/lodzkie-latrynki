/**
 * Manual scrape script — run with: npm run scrape
 * Fetches real data from UML, geocodes addresses, saves to src/lib/data/seed.json
 */
import { scrapeAllToilets } from '../src/lib/scraper/uml-parser';
import { geocodeBatch } from '../src/lib/scraper/geocoder';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🚽 Starting UML scrape...\n');

  // Step 1: Scrape
  const toilets = await scrapeAllToilets();
  console.log(`✅ Scraped ${toilets.length} toilets from UML\n`);

  // Log summary
  const free = toilets.filter(t => t.type === 'free').length;
  const paid = toilets.filter(t => t.type === 'paid').length;
  const accessible = toilets.filter(t => t.accessible).length;
  console.log(`   Free: ${free}, Paid: ${paid}, Accessible: ${accessible}\n`);

  // Step 2: Geocode addresses without coordinates
  const toGeocode = toilets
    .filter(t => t.lat === 0 && t.lng === 0)
    .map(t => ({ id: t.id, address: t.address }));

  console.log(`📍 Geocoding ${toGeocode.length} addresses (1 req/s, ~${Math.ceil(toGeocode.length * 1.1)}s)...\n`);

  if (toGeocode.length > 0) {
    const coords = await geocodeBatch(toGeocode);
    let geocoded = 0;
    let failed = 0;

    for (const toilet of toilets) {
      const coord = coords.get(toilet.id);
      if (coord) {
        toilet.lat = coord[0];
        toilet.lng = coord[1];
        geocoded++;
      } else if (toilet.lat === 0 && toilet.lng === 0) {
        failed++;
        console.log(`   ⚠️  Failed to geocode: "${toilet.name}"`);
      }
    }

    console.log(`\n✅ Geocoded: ${geocoded}, Failed: ${failed}\n`);
  }

  // Step 3: Save to seed.json
  const dataDir = join(process.cwd(), 'src', 'lib', 'data');
  mkdirSync(dataDir, { recursive: true });

  const output = {
    data: toilets,
    meta: {
      total: toilets.length,
      lastUpdated: new Date().toISOString(),
      sources: {
        uml: toilets.filter(t => t.source === 'uml').length,
        community: 0,
      },
    },
  };

  const seedPath = join(dataDir, 'seed.json');
  writeFileSync(seedPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`💾 Saved to ${seedPath}`);
  console.log(`   ${output.meta.total} toilets, ${output.meta.sources.uml} from UML`);

  // Print sample
  const withCoords = toilets.filter(t => t.lat !== 0);
  console.log(`\n📊 Sample (first 3 with coordinates):\n`);
  for (const t of withCoords.slice(0, 3)) {
    console.log(`   ${t.name}`);
    console.log(`   ${t.type} | ${t.accessible ? 'accessible' : '-'} | ${t.hours.raw || 'no hours'}`);
    console.log(`   [${t.lat}, ${t.lng}]\n`);
  }
}

main().catch(err => {
  console.error('❌ Scrape failed:', err);
  process.exit(1);
});
