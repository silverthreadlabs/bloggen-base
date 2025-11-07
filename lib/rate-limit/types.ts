/**
 * Rate limit role types
 * Easy to extend for new roles in the future
 */
export type RateLimitRole = 'anonymous' | 'registered' | 'paid';

/**
 * Rate limit configuration for a role
 */
export interface RateLimitConfig {
  /** Number of requests allowed per window */
  limit: number;
  /** Window duration in seconds */
  window: number;
  /** Display name for the role */
  name: string;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** Number of requests remaining */
  remaining: number;
  /** Time until the rate limit resets (in seconds) */
  reset: number;
  /** The role that was used for rate limiting */
  role: RateLimitRole;
  /** The identifier used (IP or userId) */
  identifier: string;
  /** Error message if rate limit exceeded */
  error?: string;
}
