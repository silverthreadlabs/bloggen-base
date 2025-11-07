import 'server-only';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';
import type { RateLimitRole } from './types';

/**
 * Extract IP address from request headers
 * Works with Vercel Edge, Cloudflare, and standard proxies
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check common proxy headers (in order of preference)
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  const realIP = headersList.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = headersList.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  // Fallback to connection remote address if available
  // This won't work in serverless environments but is here for completeness
  return 'unknown';
}

/**
 * Get user session from request headers
 */
export async function getSession(): Promise<BetterAuthSession | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    return session as unknown as BetterAuthSession | null;
  } catch {
    return null;
  }
}

/**
 * Check if user has an active paid subscription
 * A user is considered "paid" if they have an active or trialing subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const headersList = await headers();
    const subscriptions = await auth.api.listActiveSubscriptions({
      headers: headersList,
    });

    // Check if user has any active or trialing subscription
    return subscriptions.some(
      (sub) => sub.status === 'active' || sub.status === 'trialing',
    );
  } catch {
    return false;
  }
}

/**
 * Determine the rate limit role for a user
 * Priority: Paid > Registered > Anonymous
 */
export async function determineUserRole(
  session: BetterAuthSession | null,
): Promise<RateLimitRole> {
  // If no session, user is anonymous
  if (!session || !session.user) {
    return 'anonymous';
  }

  // If user is anonymous (even if logged in as anonymous user)
  if (session.user.isAnonymous) {
    return 'anonymous';
  }

  // Check if user has active subscription
  const hasSubscription = await hasActiveSubscription(session.user.id);
  if (hasSubscription) {
    return 'paid';
  }

  // Registered but not paid
  return 'registered';
}

/**
 * Get the identifier to use for rate limiting
 * - Anonymous users: IP address
 * - Registered/Paid users: userId
 */
export async function getRateLimitIdentifier(
  role: RateLimitRole,
  session: BetterAuthSession | null,
): Promise<string> {
  if (role === 'anonymous') {
    return await getClientIP();
  }

  // For registered/paid users, use userId
  if (session?.user?.id) {
    return session.user.id;
  }

  // Fallback to IP if somehow we don't have a userId
  return await getClientIP();
}

/**
 * Generate the Redis key for rate limiting
 * Format: {role}:{identifier}
 * Examples:
 * - anon:192.168.1.1
 * - user:abc123def456
 */
export function getRateLimitKey(
  role: RateLimitRole,
  identifier: string,
): string {
  const prefix = role === 'anonymous' ? 'anon' : 'user';
  return `${prefix}:${identifier}`;
}
