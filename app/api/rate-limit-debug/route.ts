import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getRateLimitDebugInfo } from '@/lib/rate-limit';

export async function GET() {
  const h = await headers();
  const debug = await getRateLimitDebugInfo();

  const ipHeaders = {
    xForwardedFor: h.get('x-forwarded-for') || null,
    xRealIp: h.get('x-real-ip') || null,
    cfConnectingIp: h.get('cf-connecting-ip') || null,
    flyClientIp: h.get('fly-client-ip') || null,
    trueClientIp: h.get('true-client-ip') || null,
  };

  return NextResponse.json({
    identifier: debug.identifier,
    role: debug.role,
    ip: debug.ip,
    fingerprint: debug.fingerprint,
    isSharedNetwork: debug.isSharedNetwork,
    config: debug.config,
    ipHeaders,
    note: 'Use this endpoint to verify the raw IP headers and identifier construction.'
  });
}
