/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
}))

import { POST } from '@/app/api/auth/site-access/route'

describe('POST /api/auth/site-access', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, SITE_PASSWORD: 'test-site-password' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Configuration', () => {
    it('returns 503 when SITE_PASSWORD is not configured', async () => {
      delete process.env.SITE_PASSWORD

      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'anything' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Site access is not configured')
    })
  })

  describe('Password validation', () => {
    it('returns 400 when password is not provided', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('returns 400 when password is empty string', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: '' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('returns 401 when password is incorrect', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrongpassword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Incorrect password')
    })

    it('returns 200 and sets cookie when password is correct', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-site-password' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Cookie setting', () => {
    it('sets hromada_site_access cookie with HMAC token (not raw password)', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-site-password' }),
      })

      const response = await POST(request)

      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('hromada_site_access=')
      // Cookie should NOT contain the raw password (uses HMAC token instead)
      expect(setCookieHeader).not.toContain('test-site-password')
    })

    it('sets hromada_site_access cookie on success', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-site-password' }),
      })

      const response = await POST(request)
      const cookie = response.cookies.get('hromada_site_access')

      expect(cookie).toBeDefined()
      expect(cookie?.value).toBeTruthy()
      // Value should be an HMAC token (hex string), not the raw password
      expect(cookie?.value).not.toBe('test-site-password')
    })
  })

  describe('Error handling', () => {
    it('returns 500 when JSON parsing fails', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Authentication failed')
    })

    it('handles null password gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: null }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('handles undefined password gracefully', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherField: 'value' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })
  })

  describe('Security', () => {
    it('does not reveal correct password in error messages', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrongpassword' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.error).not.toContain('test-site-password')
      expect(JSON.stringify(data)).not.toContain('test-site-password')
    })

    it('rejects password that is similar but not exact', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'hromada!2025' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Incorrect password')
    })

    it('rejects password with extra whitespace', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: ' test-site-password ' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Incorrect password')
    })

    it('password comparison is case-sensitive', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'TEST-SITE-PASSWORD' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Incorrect password')
    })
  })

  describe('Response format', () => {
    it('returns JSON content type on success', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-site-password' }),
      })

      const response = await POST(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('returns JSON content type on error', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      })

      const response = await POST(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('success response has correct structure', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-site-password' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toEqual({ success: true })
    })

    it('error response has correct structure', async () => {
      const request = new NextRequest('http://localhost/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })
  })
})
