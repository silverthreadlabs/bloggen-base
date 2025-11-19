# Rate Limiting System

## Overview

This rate limiting system has been enhanced to solve the issue where multiple users on the same IP address (shared networks like offices, universities, or public WiFi) would share the same rate limit pool for anonymous users.

## Problem Solved

**Before**: All anonymous users on the same IP address shared a single rate limit. If one user exhausted the limit, no other users on that IP could make requests.

**After**: Anonymous users now have individual rate limits based on a combination of:
- IP address
- Browser fingerprint (User-Agent, Accept headers, etc.)
- Special handling for known shared network IP ranges

## How It Works

### 1. Browser Fingerprinting
For anonymous users, the system creates a browser fingerprint using:
- User-Agent header
- Accept-Language header
- Accept-Encoding header
- Connection header
- DNT (Do Not Track) header

### 2. Shared Network Detection
The system detects common shared network IP patterns:
- `10.x.x.x` (Corporate networks)
- `192.168.x.x` (Local networks, often corporate/university)
- `172.16-31.x.x` (Private network ranges)

### 3. Enhanced Identifiers
- **Regular networks**: `{ip}:{fingerprint}`
- **Shared networks**: `shared:{fingerprint}:{ip_prefix}`
- **Registered users**: `{userId}`
- **Paid users**: `{userId}`

## Configuration

You can configure the behavior in `config.ts`:

```typescript
export const RATE_LIMIT_CONFIG: Record<RateLimitRole, RateLimitConfig> = {
  anonymous: {
    limit: 30,
    window: 86400,
    name: 'Anonymous',
    useBrowserFingerprint: true,     // Enable browser fingerprinting
    handleSharedNetworks: true,      // Special handling for shared networks
  },
  // ... other roles
};
```

## Usage Examples

### Basic Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

const result = await checkRateLimit();
if (!result.success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

### Custom Rate Limiting
```typescript
import { checkRateLimitWithRole } from '@/lib/rate-limit';

const result = await checkRateLimitWithRole('anonymous', 'custom-identifier');
```

### Getting User Information
```typescript
import { 
  getClientIP, 
  generateBrowserFingerprint, 
  getEnhancedAnonymousIdentifier,
  isSharedNetworkIP 
} from '@/lib/rate-limit';

const ip = await getClientIP();
const fingerprint = await generateBrowserFingerprint();
const isShared = await isSharedNetworkIP(ip);
const enhancedId = await getEnhancedAnonymousIdentifier();
```

## Benefits

1. **Individual Limits**: Each anonymous user gets their own rate limit pool
2. **Abuse Prevention**: Still prevents abuse from individual users/browsers
3. **Shared Network Support**: Better handling of corporate/university networks
4. **Configurable**: Easy to enable/disable features per role
5. **Backward Compatible**: Registered and paid users are unaffected

## Privacy Considerations

- Browser fingerprinting is only used for rate limiting purposes
- Fingerprints are hashed and truncated for privacy
- No personally identifiable information is stored
- Only used for anonymous users (registered users use their user ID)

## Monitoring

The rate limiter returns detailed information:

```typescript
interface RateLimitResult {
  success: boolean;      // Whether request is allowed
  remaining: number;     // Requests remaining in window
  reset: number;         // When the limit resets (seconds)
  role: RateLimitRole;   // User's role
  identifier: string;    // The identifier used for limiting
  error?: string;        // Error message if limit exceeded
}
```

## Performance

- Browser fingerprint generation is lightweight
- Shared network detection uses simple regex patterns
- Redis operations remain efficient with the new identifiers
- Minimal additional overhead compared to IP-only limiting
