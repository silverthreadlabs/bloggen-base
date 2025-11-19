/**
 * Rate Limiting Module
 *
 * A scalable, production-ready rate limiting system using Upstash Redis.
 * Supports multiple user roles with different rate limits.
 * 
 * Features:
 * - Role-based rate limiting (anonymous, registered, paid)
 * - Browser fingerprinting for anonymous users to prevent IP sharing issues
 * - Special handling for shared networks (corporate/university networks)
 * - Automatic user role detection based on session and subscription status
 *
 * Usage:
 * ```ts
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * const result = await checkRateLimit();
 * if (!result.success) {
 *   return new Response('Rate limit exceeded', { status: 429 });
 * }
 * ```
 * 
 * Anonymous User Rate Limiting:
 * The system now uses browser fingerprinting combined with IP addresses
 * to provide better granularity for anonymous users. This prevents the issue
 * where multiple users on the same IP (shared networks, offices, universities)
 * would share the same rate limit pool.
 */

export { addRoleConfig, getRateLimitConfig, RATE_LIMIT_CONFIG } from './config';
export { checkRateLimit, checkRateLimitWithRole } from './ratelimit';
export type { RateLimitConfig, RateLimitDebugInfo, RateLimitResult, RateLimitRole } from './types';
export {
  determineUserRole,
  generateBrowserFingerprint,
  getClientIP,
  getEnhancedAnonymousIdentifier,
  getRateLimitDebugInfo,
  getRateLimitIdentifier,
  getRateLimitKey,
  getSession,
  hasActiveSubscription,
  isSharedNetworkIP,
} from './utils';
