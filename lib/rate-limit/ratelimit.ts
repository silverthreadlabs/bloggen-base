import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getRateLimitConfig } from './config';
import type { RateLimitResult, RateLimitRole } from './types';
import {
  determineUserRole,
  getRateLimitIdentifier,
  getRateLimitKey,
  getSession,
} from './utils';

// Initialize Upstash Redis client
// These environment variables should be set in your .env file
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limiter instances cache
 * One instance per role for efficiency
 */
const rateLimiters: Map<RateLimitRole, Ratelimit> = new Map();

/**
 * Get or create a rate limiter instance for a role
 */
function getRateLimiter(role: RateLimitRole): Ratelimit {
  // Return cached instance if available
  if (rateLimiters.has(role)) {
    return rateLimiters.get(role)!;
  }

  const config = getRateLimitConfig(role);

  // Create new rate limiter instance
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.window} s`),
    analytics: true,
    prefix: `ratelimit:${role}`,
  });

  // Cache it
  rateLimiters.set(role, ratelimit);

  return ratelimit;
}

/**
 * Check rate limit for a request
 * Automatically determines role and identifier based on session
 *
 * @param req - Optional Request object (for IP extraction)
 * @returns RateLimitResult with success status and remaining count
 */
export async function checkRateLimit(): Promise<RateLimitResult> {
  try {
    // Check if Redis is configured
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn(
        'Upstash Redis not configured. Rate limiting will be bypassed. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.',
      );
      // In development or when Redis is not configured, allow all requests
      // In production, you might want to throw an error instead
      return {
        success: true,
        remaining: 999,
        reset: 0,
        role: 'anonymous',
        identifier: 'unknown',
      };
    }

    // Get session and determine role
    const session = await getSession();
    const role = await determineUserRole(session);
    const identifier = await getRateLimitIdentifier(role, session);
    const key = getRateLimitKey(role, identifier);

    // Get rate limiter for this role
    const ratelimit = getRateLimiter(role);

    // Check rate limit
    const result = await ratelimit.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      role,
      identifier,
      error: result.success
        ? undefined
        : `Rate limit exceeded. ${getRateLimitConfig(role).name} users are limited to ${getRateLimitConfig(role).limit} requests per day.`,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request to proceed
    // In production, you might want to fail closed instead
    return {
      success: true,
      remaining: 0,
      reset: 0,
      role: 'anonymous',
      identifier: 'unknown',
    };
  }
}

/**
 * Check rate limit with custom role
 * Useful when you want to override the automatic role detection
 */
export async function checkRateLimitWithRole(
  role: RateLimitRole,
  identifier: string,
): Promise<RateLimitResult> {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        success: true,
        remaining: 999,
        reset: 0,
        role,
        identifier,
      };
    }

    const key = getRateLimitKey(role, identifier);
    const ratelimit = getRateLimiter(role);
    const result = await ratelimit.limit(key);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      role,
      identifier,
      error: result.success
        ? undefined
        : `Rate limit exceeded. ${getRateLimitConfig(role).name} users are limited to ${getRateLimitConfig(role).limit} requests per day.`,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      success: true,
      remaining: 0,
      reset: 0,
      role,
      identifier,
    };
  }
}
