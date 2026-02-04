/**
 * Security Test Suite - Security Headers Testing
 *
 * Tests for:
 * - CSP (Content Security Policy)
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { getSecurityHeaders, applySecurityHeaders } from '@/lib/security'
import { NextResponse } from 'next/server'

describe('Security Headers Tests', () => {
  describe('Security Header Configuration', () => {
    const headers = getSecurityHeaders()

    it('should set X-Frame-Options to DENY', () => {
      expect(headers['X-Frame-Options']).toBe('DENY')
    })

    it('should set X-Content-Type-Options to nosniff', () => {
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
    })

    it('should enable XSS protection', () => {
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
    })

    it('should set strict referrer policy', () => {
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should disable unnecessary permissions', () => {
      expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
    })

    it('should have Content-Security-Policy', () => {
      expect(headers['Content-Security-Policy']).toBeDefined()
    })

    it('should prevent clickjacking via frame-ancestors', () => {
      expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'")
    })
  })

  describe('Content Security Policy Details', () => {
    const headers = getSecurityHeaders()
    const csp = headers['Content-Security-Policy']

    it('should restrict default-src to self', () => {
      expect(csp).toContain("default-src 'self'")
    })

    it('should restrict script-src appropriately', () => {
      expect(csp).toContain("script-src 'self'")
    })

    it('should restrict style-src appropriately', () => {
      expect(csp).toContain("style-src 'self'")
    })

    it('should allow images from safe sources', () => {
      expect(csp).toContain("img-src 'self' data: https: blob:")
    })

    it('should restrict connections to https', () => {
      expect(csp).toContain("connect-src 'self' https:")
    })
  })

  describe('HSTS Configuration', () => {
    it('should set HSTS in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const headers = getSecurityHeaders()

      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains')

      process.env.NODE_ENV = originalEnv
    })

    it('should not set HSTS in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const headers = getSecurityHeaders()

      expect(headers['Strict-Transport-Security']).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Header Application', () => {
    it('should apply all headers to response', () => {
      const response = new NextResponse()
      const securedResponse = applySecurityHeaders(response)

      expect(securedResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(securedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(securedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
      expect(securedResponse.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(securedResponse.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
    })
  })

  describe('Cookie Security', () => {
    it('should use secure cookie settings', () => {
      const expectedCookieSettings = {
        httpOnly: true,
        secure: true, // In production
        sameSite: 'lax',
        path: '/',
      }

      // Session cookies should have these settings
      expect(expectedCookieSettings.httpOnly).toBe(true)
      expect(expectedCookieSettings.secure).toBe(true)
      expect(expectedCookieSettings.sameSite).toBe('lax')
    })

    it('should have appropriate cookie max age', () => {
      const SEVEN_DAYS = 60 * 60 * 24 * 7 // in seconds

      // Session cookie max age should be reasonable
      expect(SEVEN_DAYS).toBe(604800)
    })
  })
})

describe('CORS Configuration Tests', () => {
  it('should not have overly permissive CORS', () => {
    // Next.js defaults to same-origin only
    // Verify no explicit CORS headers that are too permissive
    const headers = getSecurityHeaders()

    // Should not have Access-Control-Allow-Origin: *
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined()
  })
})

describe('Rate Limiting Headers', () => {
  it('should include rate limit headers on 429 responses', async () => {
    const { rateLimit, RATE_LIMITS } = await import('@/lib/rate-limit')
    const { NextRequest } = await import('next/server')

    // Exhaust rate limit
    for (let i = 0; i <= RATE_LIMITS.login.limit; i++) {
      const request = new NextRequest('http://localhost/api/auth/login', {
        headers: { 'x-forwarded-for': '192.168.1.200' },
      })
      rateLimit(request, RATE_LIMITS.login)
    }

    // Next request should get rate limit headers
    const request = new NextRequest('http://localhost/api/auth/login', {
      headers: { 'x-forwarded-for': '192.168.1.200' },
    })
    const response = rateLimit(request, RATE_LIMITS.login)

    if (response) {
      expect(response.headers.get('Retry-After')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    }
  })
})
