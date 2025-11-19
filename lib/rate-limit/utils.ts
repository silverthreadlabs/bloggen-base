import 'server-only';

import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import type { BetterAuthSession } from '@/lib/auth/auth-types';
import type { RateLimitConfig, RateLimitRole } from './types';

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
 * Generate a browser fingerprint for anonymous users
 * Creates a unique identifier based on browser characteristics
 */
export async function generateBrowserFingerprint(): Promise<string> {
  const headersList = await headers();
  
  const userAgent = headersList.get('user-agent') || '';
  const acceptLanguage = headersList.get('accept-language') || '';
  const acceptEncoding = headersList.get('accept-encoding') || '';
  const connection = headersList.get('connection') || '';
  const dnt = headersList.get('dnt') || '';
  
  // Create a simple hash from browser characteristics
  // Using multiple headers to create a more unique fingerprint
  const fingerprint = Buffer.from(
    `${userAgent}-${acceptLanguage}-${acceptEncoding}-${connection}-${dnt}`
  ).toString('base64').slice(0, 16);
  
  return fingerprint;
}

/**
 * Check if IP is from a known shared network (educational institutions, corporate networks, etc.)
 * This is a simplified check - in production you might want to use a more comprehensive database
 */
export async function isSharedNetworkIP(ip: string): Promise<boolean> {
  // Common patterns for shared networks
  const sharedNetworkPatterns = [
    /^10\./,          // Private network (often corporate)
    /^192\.168\./,    // Private network (often corporate/university)
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private network range
  ];
  
  return sharedNetworkPatterns.some(pattern => pattern.test(ip));
}

/**
 * Generate an enhanced identifier for anonymous users on shared networks
 */
export async function getEnhancedAnonymousIdentifier(): Promise<string> {
  const ip = await getClientIP();
  const fingerprint = await generateBrowserFingerprint();
  
  // Check if shared network handling is enabled
  const { getRateLimitConfig } = await import('./config');
  const config = getRateLimitConfig('anonymous');
  
  if (config.handleSharedNetworks) {
    const isShared = await isSharedNetworkIP(ip);
    
    if (isShared) {
      // For shared networks, prioritize browser fingerprint over IP
      return `shared:${fingerprint}:${ip.split('.').slice(0, 2).join('.')}`;
    }
  }
  
  // For regular networks, use IP + fingerprint
  return `${ip}:${fingerprint}`;
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
 * - Anonymous users: Enhanced identifier (IP + browser fingerprint, with special handling for shared networks)
 * - Registered/Paid users: userId
 */
export async function getRateLimitIdentifier(
  role: RateLimitRole,
  session: BetterAuthSession | null,
): Promise<string> {
  const { getRateLimitConfig } = await import('./config');
  const config = getRateLimitConfig(role);
  
  if (role === 'anonymous') {
    // (1) Persistent guest cookie ID if enabled
    let guestId: string | null = null;
    if (config.useGuestCookie) {
      guestId = await getOrCreateGuestId();
    }

    // (2) Build base components
    const ip = await getClientIP();
    const fingerprint = config.useBrowserFingerprint
      ? await generateBrowserFingerprint()
      : 'no-fp';

    // (3) Shared network handling still applied inside enhanced identifier when fingerprinting enabled
    if (config.useBrowserFingerprint) {
      const enhanced = await getEnhancedAnonymousIdentifier();
      // If we have a guestId, prepend it for per-device uniqueness
      return guestId ? `g:${guestId}:${enhanced}` : enhanced;
    }

    // (4) Fallback combinations when fingerprinting disabled
    if (guestId) {
      return `g:${guestId}:${ip}`;
    }
    return ip;
  }

  // For registered/paid users, use userId
  if (session?.user?.id) {
    return session.user.id;
  }

  // Fallback to enhanced anonymous identifier if somehow we don't have a userId
  if (config.useBrowserFingerprint) {
    return await getEnhancedAnonymousIdentifier();
  }
  
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

/**
 * Debug information for rate limiting
 * Useful for monitoring and troubleshooting
 */
export interface RateLimitDebugInfo {
  ip: string;
  fingerprint: string;
  identifier: string;
  role: RateLimitRole;
  isSharedNetwork: boolean;
  config: RateLimitConfig;
}

/**
 * Get debug information about rate limiting for the current request
 * Useful for monitoring and troubleshooting rate limit issues
 */
export async function getRateLimitDebugInfo(): Promise<RateLimitDebugInfo> {
  const { getRateLimitConfig } = await import('./config');
  
  const session = await getSession();
  const role = await determineUserRole(session);
  const config = getRateLimitConfig(role);
  const ip = await getClientIP();
  const fingerprint = await generateBrowserFingerprint();
  const identifier = await getRateLimitIdentifier(role, session);
  const isSharedNetwork = await isSharedNetworkIP(ip);
  
  return {
    ip,
    fingerprint,
    identifier,
    role,
    isSharedNetwork,
    config,
  };
}

/**
 * Get or create a persistent guest ID cookie for anonymous visitors.
 * This allows distinguishing devices even when IP addresses are shared (NAT, proxies).
 */
async function getOrCreateGuestId(): Promise<string> {
  const store = await cookies();
  const existing = store.get('guest_id')?.value;
  if (existing) return existing;

  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

  // 30 days persistence; adjust as needed
  // Note: In edge/runtime where cookies may be read-only, this might no-op.
  try {
    const secure = process.env.NODE_ENV === 'production';
    store.set?.('guest_id', id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  } catch {
    // swallow errors (e.g., read-only cookies in certain contexts)
  }
  return id;
}
