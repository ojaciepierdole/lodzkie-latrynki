import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ToiletsResponse } from '@/lib/types/toilet';

export async function GET() {
  try {
    const seedPath = join(process.cwd(), 'src', 'lib', 'data', 'seed.json');
    const raw = readFileSync(seedPath, 'utf-8');
    const response = JSON.parse(raw) as ToiletsResponse;

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to fetch toilets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch toilet data' },
      { status: 500 }
    );
  }
}
