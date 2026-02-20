/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock next-intl middleware
jest.mock('next-intl/middleware', () => {
  return jest.fn(() => {
    return (request: NextRequest) => {
      return NextResponse.next()
    }
  })
})

// Mock i18n
jest.mock('@/i18n', () => ({
  locales: ['en', 'uk'],
}))

// Mock security headers
jest.mock('@/lib/security-headers', () => ({
  getSecurityHeaders: () => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }),
}))

// Mock jose
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}))

import middleware from '@/middleware'
import { jwtVerify } from 'jose'

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>

function makeRequest(
  path: string,
  options: {
    method?: string
    headers?: Record<string, string>
    cookies?: Record<string, string>
    geo?: { country?: string }
    ip?: string
  } = {}
) {
  const url = `http://localhost${path}`
  const req = new NextRequest(url, {
    method: options.method || 'GET',
    headers: options.headers,
  })

  // Set cookies
  if (options.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value)
    }
  }

  // Add geo data
  if (options.geo) {
    Object.defineProperty(req, 'geo', { value: options.geo, writable: true })
  }

  if (options.ip) {
    Object.defineProperty(req, 'ip', { value: options.ip, writable: true })
  }

  return req
}

describe('middleware', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      SITE_PASSWORD: 'hromadav2!2026',
      SESSION_SECRET: 'test-secret-that-is-long-enough-for-testing',
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('API routes', () => {
    it('passes through API GET requests', async () => {
      const req = makeRequest('/api/projects')
      const response = await middleware(req)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('allows API POST with matching origin', async () => {
      const req = makeRequest('/api/contact', {
        method: 'POST',
        headers: { origin: 'http://localhost', host: 'localhost' },
      })
      const response = await middleware(req)

      expect(response.status).toBe(200)
    })

    it('blocks API POST with mismatched origin', async () => {
      const req = makeRequest('/api/contact', {
        method: 'POST',
        headers: { origin: 'http://evil.com', host: 'localhost' },
      })
      const response = await middleware(req)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('origin')
    })

    it('allows API POST without origin header', async () => {
      const req = makeRequest('/api/projects', {
        method: 'POST',
        headers: { host: 'localhost' },
      })
      const response = await middleware(req)

      expect(response.status).toBe(200)
    })
  })

  describe('site-access page', () => {
    it('allows access to site-access page without cookie', async () => {
      const req = makeRequest('/en/site-access')
      const response = await middleware(req)

      // Should pass through intl middleware, not redirect
      expect(response.status).toBe(200)
    })
  })

  describe('site password gate', () => {
    it('returns 503 when SITE_PASSWORD is not set', async () => {
      delete process.env.SITE_PASSWORD

      const req = makeRequest('/en/projects')
      const response = await middleware(req)

      expect(response.status).toBe(503)
    })

    it('redirects to site-access when no cookie present', async () => {
      const req = makeRequest('/en/projects')
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/site-access')
    })

    it('redirects to site-access with correct locale', async () => {
      const req = makeRequest('/uk/projects')
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/uk/site-access')
    })

    it('redirects to site-access when cookie is invalid', async () => {
      const req = makeRequest('/en/projects', {
        cookies: { hromada_site_access: 'invalid-token' },
      })
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/site-access')
    })

    it('includes redirect path in site-access URL', async () => {
      const req = makeRequest('/en/projects')
      const response = await middleware(req)

      const location = response.headers.get('location')!
      expect(location).toContain('redirect=%2Fen%2Fprojects')
    })
  })

  describe('geo-blocking', () => {
    it('applies security headers to all responses', async () => {
      const req = makeRequest('/api/projects')
      const response = await middleware(req)

      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('with valid site access cookie', () => {
    let validToken: string

    beforeAll(async () => {
      // Compute the same HMAC the middleware computes
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', 'hromadav2!2026')
      hmac.update('hromada_site_access')
      validToken = hmac.digest('hex')
    })

    // Helper to derive the valid cookie using Web Crypto (matching middleware)
    async function getValidCookie(): Promise<string> {
      const encoder = new TextEncoder()
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode('hromadav2!2026'),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode('hromada_site_access'))
      return Array.from(new Uint8Array(signature))
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('')
    }

    it('allows access to normal pages with valid cookie', async () => {
      const token = await getValidCookie()
      const req = makeRequest('/en/projects', {
        cookies: { hromada_site_access: token },
      })
      const response = await middleware(req)

      // Should pass through (200 from intl middleware), not redirect
      expect(response.status).toBe(200)
    })

    it('allows access to /blocked page without checking geo', async () => {
      const token = await getValidCookie()
      const req = makeRequest('/en/blocked', {
        cookies: { hromada_site_access: token },
      })
      const response = await middleware(req)

      expect(response.status).toBe(200)
    })

    it('redirects blocked countries to /blocked', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const token = await getValidCookie()
      const req = makeRequest('/en/projects', {
        cookies: { hromada_site_access: token },
        geo: { country: 'RU' },
        ip: '1.2.3.4',
      })
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/en/blocked')
      consoleSpy.mockRestore()
    })

    it('redirects blocked countries using CloudFront header fallback', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const token = await getValidCookie()
      const req = makeRequest('/en/about', {
        cookies: { hromada_site_access: token },
        headers: { 'cloudfront-viewer-country': 'BY' },
      })
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/blocked')
      consoleSpy.mockRestore()
    })

    it('redirects unauthenticated users from protected admin route to login', async () => {
      mockJwtVerify.mockRejectedValue(new Error('invalid'))
      const token = await getValidCookie()
      const req = makeRequest('/en/admin', {
        cookies: { hromada_site_access: token },
      })
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(response.headers.get('location')).toContain('redirect=')
    })

    it('redirects users with wrong role from admin route', async () => {
      mockJwtVerify.mockResolvedValue({ payload: { role: 'DONOR' }, protectedHeader: { alg: 'HS256' } } as any)
      const token = await getValidCookie()
      const req = makeRequest('/en/admin', {
        cookies: {
          hromada_site_access: token,
          hromada_session: 'some-jwt-token',
        },
      })
      const response = await middleware(req)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('allows admin access with ADMIN role', async () => {
      mockJwtVerify.mockResolvedValue({ payload: { role: 'ADMIN' }, protectedHeader: { alg: 'HS256' } } as any)
      const token = await getValidCookie()
      const req = makeRequest('/en/admin', {
        cookies: {
          hromada_site_access: token,
          hromada_session: 'some-jwt-token',
        },
      })
      const response = await middleware(req)

      expect(response.status).toBe(200)
    })

    it('allows partner access with PARTNER role', async () => {
      mockJwtVerify.mockResolvedValue({ payload: { role: 'PARTNER' }, protectedHeader: { alg: 'HS256' } } as any)
      const token = await getValidCookie()
      const req = makeRequest('/en/partner', {
        cookies: {
          hromada_site_access: token,
          hromada_session: 'some-jwt-token',
        },
      })
      const response = await middleware(req)

      expect(response.status).toBe(200)
    })

    it('applies security headers to passthrough responses', async () => {
      const token = await getValidCookie()
      const req = makeRequest('/en/about', {
        cookies: { hromada_site_access: token },
      })
      const response = await middleware(req)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('security headers', () => {
    it('applies headers to API responses', async () => {
      const req = makeRequest('/api/test')
      const response = await middleware(req)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })

    it('applies headers to redirect responses', async () => {
      const req = makeRequest('/en/projects')
      const response = await middleware(req)

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })
  })
})
