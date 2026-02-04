/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Create mock storage that persists across jest.mock hoisting
const mockStorage = {
  jwtVerify: jest.fn(),
}

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation((payload) => {
    return {
      setProtectedHeader: jest.fn().mockReturnThis(),
      setIssuedAt: jest.fn().mockReturnThis(),
      setExpirationTime: jest.fn().mockReturnThis(),
      sign: jest.fn().mockImplementation(async () => {
        // Create a mock JWT that encodes the payload
        const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
        const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url')
        return `${header}.${payloadStr}.mock-signature`
      }),
    }
  }),
  jwtVerify: (...args: unknown[]) => mockStorage.jwtVerify(...args),
}))

// Mock next/headers cookies
const mockCookies = {
  get: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies)),
}))

import { verifyAdminAuth, unauthorizedResponse, createSignedToken } from '@/lib/auth'

// Reference to the mock for use in tests
const mockJwtVerify = mockStorage.jwtVerify

describe('verifyAdminAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, HROMADA_ADMIN_SECRET: 'test-secret-123' }
    mockCookies.get.mockReturnValue(undefined)
    // Default: jwtVerify throws (invalid token)
    mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))
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
    it('returns true for valid legacy session cookie', async () => {
      const validToken = Buffer.from('test-secret-123:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: validToken })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
      expect(mockCookies.get).toHaveBeenCalledWith('hromada_session')
    })

    it('returns true for valid JWT session with ADMIN role', async () => {
      const validToken = 'valid-jwt-token'
      mockCookies.get.mockReturnValue({ value: validToken })
      // Mock jwtVerify to return valid ADMIN payload
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 'admin-user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
    })

    it('returns false for valid JWT session with non-ADMIN role', async () => {
      const validToken = 'valid-jwt-token'
      mockCookies.get.mockReturnValue({ value: validToken })
      // Mock jwtVerify to return valid PARTNER payload
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 'partner-user-1',
          email: 'partner@example.com',
          role: 'PARTNER',
        },
      })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
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

  describe('Security: forged token rejection', () => {
    it('SECURITY: rejects forged unsigned admin token', async () => {
      // Attacker tries to create a fake admin session with plain base64
      const forgedToken = Buffer.from(JSON.stringify({
        userId: 'hacker',
        email: 'hacker@evil.com',
        role: 'ADMIN',
      })).toString('base64')
      mockCookies.get.mockReturnValue({ value: forgedToken })
      // jwtVerify should reject this (default mock behavior)
      mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects tampered JWT with modified payload', async () => {
      // Attacker has a tampered token
      const tamperedToken = 'header.tamperedPayload.signature'
      mockCookies.get.mockReturnValue({ value: tamperedToken })
      // jwtVerify should reject tampered tokens (signature won't match)
      mockJwtVerify.mockRejectedValue(new Error('signature verification failed'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects JWT signed with different secret', async () => {
      // Attacker creates their own JWT with a different secret
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJoYWNrZXIiLCJyb2xlIjoiQURNSU4ifQ.invalid-signature'
      mockCookies.get.mockReturnValue({ value: fakeJwt })
      // jwtVerify should reject tokens signed with wrong secret
      mockJwtVerify.mockRejectedValue(new Error('signature verification failed'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects expired JWT tokens', async () => {
      const expiredToken = 'expired-jwt-token'
      mockCookies.get.mockReturnValue({ value: expiredToken })
      // jwtVerify should reject expired tokens
      mockJwtVerify.mockRejectedValue(new Error('jwt expired'))

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
