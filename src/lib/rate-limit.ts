import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// For production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

interface RateLimitConfig {
  // Maximum number of requests allowed
  limit: number
  // Time window in seconds
  windowSeconds: number
  // Optional custom key generator (defaults to IP)
  keyGenerator?: (request: NextRequest) => string
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback - in development this might be ::1 or 127.0.0.1
  return 'unknown'
}

/**
 * Check if request should be rate limited
 * Returns null if allowed, or a Response if rate limited
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  cleanupExpiredEntries()

  const { limit, windowSeconds, keyGenerator } = config
  const windowMs = windowSeconds * 1000
  const now = Date.now()

  // Generate key for this request
  const ip = getClientIP(request)
  const path = new URL(request.url).pathname
  const key = keyGenerator ? keyGenerator(request) : `${ip}:${path}`

  // Get or create entry
  let entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return null // Request allowed
  }

  // Increment count
  entry.count++

  if (entry.count > limit) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
        },
      }
    )
  }

  // Request allowed
  return null
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Contact form: 5 submissions per minute per IP
  contact: {
    limit: 5,
    windowSeconds: 60,
  },
  // Project submissions: 3 per hour per IP
  projectSubmission: {
    limit: 3,
    windowSeconds: 3600,
  },
  // Login attempts: 5 per minute per IP (brute force protection)
  login: {
    limit: 5,
    windowSeconds: 60,
  },
  // General API: 100 requests per minute per IP
  general: {
    limit: 100,
    windowSeconds: 60,
  },
} as const
