import type { RateLimitConfig, RateLimitRole } from './types';

/**
 * Rate limit configuration per role
 * Easy to add new roles or modify existing limits
 */
export const RATE_LIMIT_CONFIG: Record<RateLimitRole, RateLimitConfig> = {
  anonymous: {
    limit: 5,
    window: 86400, // 24 hours in seconds (1 day)
    name: 'Anonymous',
  },
  registered: {
    limit: 9000,
    window: 86400, // 24 hours in seconds (1 day)
    name: 'Registered',
  },
  paid: {
    limit: 100,
    window: 86400, // 24 hours in seconds (1 day)
    name: 'Paid',
  },
};

/**
 * Get rate limit config for a role
 */
export function getRateLimitConfig(role: RateLimitRole): RateLimitConfig {
  return RATE_LIMIT_CONFIG[role];
}

/**
 * Add a new role configuration
 * Example usage:
 * ```
 * addRoleConfig('premium', { limit: 500, window: 86400, name: 'Premium' });
 * ```
 */
export function addRoleConfig(
  role: RateLimitRole,
  config: RateLimitConfig,
): void {
  RATE_LIMIT_CONFIG[role] = config;
}
