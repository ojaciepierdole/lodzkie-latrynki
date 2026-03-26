import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { CommunitySubmission } from '@/lib/types/toilet';

/**
 * POST /api/suggest
 *
 * Crowdsource endpoint for community toilet submissions (v1.1)
 * Rate limited: 5 submissions per hour per IP
 */

// Simple in-memory rate limiter (use Redis/KV in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 hour.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.address || !body.name) {
      return NextResponse.json(
        { error: 'Address and name are required' },
        { status: 400 }
      );
    }

    const submission: CommunitySubmission = {
      id: randomUUID(),
      toilet: {
        source: 'community',
        name: body.name,
        address: body.address,
        type: body.type || 'free',
        accessible: body.accessible || false,
        description: body.notes,
        hours: { raw: body.hours || '' },
        is24h: false,
        status: 'pending',
      },
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    // TODO: Store in Vercel KV or Blob in production
    console.log('[Suggest] New submission:', submission);

    return NextResponse.json({
      success: true,
      id: submission.id,
    });
  } catch (error) {
    console.error('[Suggest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    );
  }
}
