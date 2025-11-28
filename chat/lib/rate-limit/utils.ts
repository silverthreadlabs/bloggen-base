import 'server-only';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';
import type { RateLimitRole } from './types';

/**
 * Extract IP address from request headers
 * Works with Vercel Edge, Cloudflare, and standard proxies
 */
export async function getClientIP(req?: Request | any): Promise<string> {
  let ip = 'unknown';

  // 1. Try to get IP directly from the request (NextRequest)
  if (req?.ip) {
    ip = req.ip;
  }

  // 2. Try to get IP from request headers (if provided)
  if (!ip || ip === 'unknown') {
    if (req?.headers?.get) {
      const forwardedFor = req.headers.get('x-forwarded-for');
      if (forwardedFor) {
        ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
      }

      if (!ip || ip === 'unknown') {
        const realIP = req.headers.get('x-real-ip');
        if (realIP) {
          ip = realIP.trim();
        }
      }

      if (!ip || ip === 'unknown') {
        const cfConnectingIP = req.headers.get('cf-connecting-ip');
        if (cfConnectingIP) {
          ip = cfConnectingIP.trim();
        }
      }
    }
  }

  // 3. Fallback to Next.js headers()
  if (!ip || ip === 'unknown') {
    const headersList = await headers();

    // Check common proxy headers (in order of preference)
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      ip = forwardedFor.split(',')[0]?.trim() || 'unknown';
    }

    if (!ip || ip === 'unknown') {
      const realIP = headersList.get('x-real-ip');
      if (realIP) {
        ip = realIP.trim();
      }
    }

    if (!ip || ip === 'unknown') {
      const cfConnectingIP = headersList.get('cf-connecting-ip'); // Cloudflare
      if (cfConnectingIP) {
        ip = cfConnectingIP.trim();
      }
    }
  }

  // Handle localhost/loopback addresses in development
  if (isLocalhost(ip)) {
    // In development, we can use a combination of user agent + timestamp
    // to create a pseudo-unique identifier that changes when needed
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown-browser';
    const sessionId = generateDevSessionId(userAgent);
    return `dev-${sessionId}`;
  }

  return ip || 'unknown';
}

/**
 * Check if IP is localhost/loopback
 */
function isLocalhost(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;
  
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    Boolean(ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./))
  );
}

/**
 * Generate a development session ID based on user agent and other factors
 * This creates a unique identifier for development that can change when needed
 */
function generateDevSessionId(userAgent: string): string {
  // Create a simple hash from user agent
  const hash = userAgent
    .split('')
    .reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
  
  // Add current date to make it change daily (optional)
  const today = new Date().toISOString().split('T')[0];
  
  return `${Math.abs(hash)}-${today.replace(/-/g, '')}`;
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
  req?: Request | any,
): Promise<string> {
  if (role === 'anonymous') {
    console.log(await getClientIP(req));
    return await getClientIP(req);
  }

  // For registered/paid users, use userId
  if (session?.user?.id) {
    return session.user.id;
  }
  console.log(await getClientIP(req));

  // Fallback to IP if somehow we don't have a userId
  return await getClientIP(req);
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
