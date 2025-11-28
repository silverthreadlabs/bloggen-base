/**
 * Rate Limiting Module
 *
 * A scalable, production-ready rate limiting system using Upstash Redis.
 * Supports multiple user roles with different rate limits.
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
 */

export { addRoleConfig, getRateLimitConfig, RATE_LIMIT_CONFIG } from './config';
export { checkRateLimit, checkRateLimitWithRole } from './ratelimit';
export type { RateLimitConfig, RateLimitResult, RateLimitRole } from './types';
export {
  determineUserRole,
  getClientIP,
  getRateLimitIdentifier,
  getRateLimitKey,
  getSession,
  hasActiveSubscription,
} from './utils';
