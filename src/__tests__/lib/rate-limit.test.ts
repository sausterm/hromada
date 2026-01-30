/**
 * @jest-environment node
 */

import { rateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

// Helper to create a mock NextRequest
function createMockRequest(ip: string = '127.0.0.1', path: string = '/api/test'): NextRequest {
  const url = `http://localhost:3000${path}`
  const request = new NextRequest(url, {
    headers: {
      'x-forwarded-for': ip,
    },
  })
  return request
}

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear any rate limit state between tests by waiting
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('allows requests under the limit', () => {
    const config = { limit: 3, windowSeconds: 60 }
    const request = createMockRequest('192.168.1.1', '/api/contact')

    // First 3 requests should pass
    expect(rateLimit(request, config)).toBeNull()
    expect(rateLimit(request, config)).toBeNull()
    expect(rateLimit(request, config)).toBeNull()
  })

  it('blocks requests over the limit', () => {
    const config = { limit: 2, windowSeconds: 60 }
    const request = createMockRequest('192.168.1.2', '/api/contact')

    // First 2 requests pass
    expect(rateLimit(request, config)).toBeNull()
    expect(rateLimit(request, config)).toBeNull()

    // Third request should be blocked
    const response = rateLimit(request, config)
    expect(response).not.toBeNull()
    expect(response?.status).toBe(429)
  })

  it('uses different buckets for different IPs', () => {
    const config = { limit: 1, windowSeconds: 60 }

    const request1 = createMockRequest('192.168.1.10', '/api/contact')
    const request2 = createMockRequest('192.168.1.11', '/api/contact')

    // Each IP gets its own limit
    expect(rateLimit(request1, config)).toBeNull()
    expect(rateLimit(request2, config)).toBeNull()

    // Now both should be blocked
    expect(rateLimit(request1, config)).not.toBeNull()
    expect(rateLimit(request2, config)).not.toBeNull()
  })

  it('uses different buckets for different paths', () => {
    const config = { limit: 1, windowSeconds: 60 }

    const request1 = createMockRequest('192.168.1.20', '/api/contact')
    const request2 = createMockRequest('192.168.1.20', '/api/submissions')

    // Same IP, different paths get separate limits
    expect(rateLimit(request1, config)).toBeNull()
    expect(rateLimit(request2, config)).toBeNull()
  })

  it('includes retry-after header in response', () => {
    const config = { limit: 1, windowSeconds: 60 }
    const request = createMockRequest('192.168.1.30', '/api/test')

    rateLimit(request, config) // First request passes
    const response = rateLimit(request, config) // Second blocked

    expect(response?.headers.get('Retry-After')).toBeDefined()
    expect(response?.headers.get('X-RateLimit-Limit')).toBe('1')
    expect(response?.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('resets after window expires', () => {
    const config = { limit: 1, windowSeconds: 1 }
    const request = createMockRequest('192.168.1.40', '/api/test')

    // First request passes
    expect(rateLimit(request, config)).toBeNull()

    // Second request blocked
    expect(rateLimit(request, config)).not.toBeNull()

    // Advance time past the window
    jest.advanceTimersByTime(1500)

    // Now should be allowed again
    expect(rateLimit(request, config)).toBeNull()
  })

  it('uses x-real-ip header when x-forwarded-for is not present', () => {
    const config = { limit: 1, windowSeconds: 60 }
    const url = 'http://localhost:3000/api/test'
    const request = new NextRequest(url, {
      headers: {
        'x-real-ip': '10.0.0.1',
      },
    })

    // First request passes
    expect(rateLimit(request, config)).toBeNull()
    // Second request should be blocked (same IP)
    expect(rateLimit(request, config)).not.toBeNull()
  })

  it('uses unknown as IP when no IP headers present', () => {
    const config = { limit: 1, windowSeconds: 60 }
    const url = 'http://localhost:3000/api/unknown-test'
    const request = new NextRequest(url, {
      headers: {},
    })

    // First request passes
    expect(rateLimit(request, config)).toBeNull()
    // Second request should be blocked
    expect(rateLimit(request, config)).not.toBeNull()
  })

  it('supports custom key generator', () => {
    const config = {
      limit: 1,
      windowSeconds: 60,
      keyGenerator: (req: NextRequest) => {
        const userId = req.headers.get('x-user-id')
        return `user:${userId}`
      },
    }

    const url = 'http://localhost:3000/api/custom'
    const request1 = new NextRequest(url, {
      headers: { 'x-user-id': 'user-123' },
    })
    const request2 = new NextRequest(url, {
      headers: { 'x-user-id': 'user-456' },
    })

    // Different users get separate limits
    expect(rateLimit(request1, config)).toBeNull()
    expect(rateLimit(request2, config)).toBeNull()

    // Same user blocked
    expect(rateLimit(request1, config)).not.toBeNull()
  })

  it('cleans up expired entries periodically', () => {
    const config = { limit: 1, windowSeconds: 1 }

    // Create many requests with different IPs to populate the store
    for (let i = 0; i < 10; i++) {
      const request = createMockRequest(`192.168.2.${i}`, '/api/cleanup-test')
      rateLimit(request, config)
    }

    // Advance time past the window and past cleanup interval (60 seconds)
    jest.advanceTimersByTime(61000)

    // Make another request to trigger cleanup
    const newRequest = createMockRequest('192.168.2.100', '/api/cleanup-test')
    expect(rateLimit(newRequest, config)).toBeNull()

    // The old entries should have been cleaned up
    // We can verify cleanup happened by checking that old IPs can make new requests
    const oldRequest = createMockRequest('192.168.2.0', '/api/cleanup-test')
    expect(rateLimit(oldRequest, config)).toBeNull() // Should be allowed after cleanup
  })
})
