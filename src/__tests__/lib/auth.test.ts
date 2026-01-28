/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { verifyAdminAuth, unauthorizedResponse } from '@/lib/auth'

// Mock next/headers cookies
const mockCookies = {
  get: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies)),
}))

describe('verifyAdminAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, HROMADA_ADMIN_SECRET: 'test-secret-123' }
    mockCookies.get.mockReturnValue(undefined)
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('when HROMADA_ADMIN_SECRET is not configured', () => {
    it('returns false', async () => {
      delete process.env.HROMADA_ADMIN_SECRET

      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer any-token' },
      })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })
  })

  describe('Bearer token authentication', () => {
    it('returns true for valid Bearer token', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer test-secret-123' },
      })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
    })

    it('returns false for invalid Bearer token', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer wrong-secret' },
      })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('returns false for missing Authorization header', async () => {
      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('returns false for non-Bearer authorization', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })
  })

  describe('Cookie authentication', () => {
    it('returns true for valid session cookie', async () => {
      const validToken = Buffer.from('test-secret-123:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: validToken })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
      expect(mockCookies.get).toHaveBeenCalledWith('hromada_admin_session')
    })

    it('returns false for invalid session cookie secret', async () => {
      const invalidToken = Buffer.from('wrong-secret:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: invalidToken })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('returns false for empty cookie value', async () => {
      mockCookies.get.mockReturnValue({ value: '' })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('returns false for missing cookie', async () => {
      mockCookies.get.mockReturnValue(undefined)

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('handles invalid base64 in cookie gracefully', async () => {
      mockCookies.get.mockReturnValue({ value: '!!!not-base64!!!' })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })
  })

  describe('authentication priority', () => {
    it('Bearer token takes precedence over cookie', async () => {
      // Valid Bearer token
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer test-secret-123' },
      })

      // Cookie with different (invalid) secret
      const invalidToken = Buffer.from('wrong-secret:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: invalidToken })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
    })

    it('falls back to cookie when Bearer token is invalid', async () => {
      // Invalid Bearer token
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer wrong-secret' },
      })

      // Valid cookie
      const validToken = Buffer.from('test-secret-123:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: validToken })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
    })
  })
})

describe('unauthorizedResponse', () => {
  it('returns 401 response with error message', async () => {
    const response = unauthorizedResponse()

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('has correct content-type header', () => {
    const response = unauthorizedResponse()

    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})
