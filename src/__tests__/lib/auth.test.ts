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

// Mock prisma for validateSessionWithDatabase tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import { verifyAdminAuth, unauthorizedResponse, createSignedToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Reference to the mock for use in tests
const mockJwtVerify = mockStorage.jwtVerify

describe('verifyAdminAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars' }
    mockCookies.get.mockReturnValue(undefined)
    // Default: jwtVerify throws (invalid token)
    mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))
    // Default: DB validation returns valid
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-user-1',
      isActive: true,
      lockedUntil: null,
      sessionVersion: 1,
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('JWT Cookie authentication', () => {
    it('returns true for valid JWT session with ADMIN role', async () => {
      const validToken = 'valid-jwt-token'
      mockCookies.get.mockReturnValue({ value: validToken })
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 'admin-user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          sessionVersion: 1,
        },
      })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(true)
    })

    it('returns false for valid JWT session with non-ADMIN role', async () => {
      const validToken = 'valid-jwt-token'
      mockCookies.get.mockReturnValue({ value: validToken })
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

    it('returns false when DB validation fails (deactivated user)', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-jwt' })
      mockJwtVerify.mockResolvedValue({
        payload: {
          userId: 'admin-user-1',
          email: 'admin@example.com',
          role: 'ADMIN',
          sessionVersion: 1,
        },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'admin-user-1',
        isActive: false,
        lockedUntil: null,
        sessionVersion: 1,
      })

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })
  })

  describe('Bearer token rejection', () => {
    it('rejects Bearer token (no longer supported)', async () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: { Authorization: 'Bearer test-secret-123' },
      })

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })
  })

  describe('Security: forged token rejection', () => {
    it('SECURITY: rejects forged unsigned admin token', async () => {
      const forgedToken = Buffer.from(JSON.stringify({
        userId: 'hacker',
        email: 'hacker@evil.com',
        role: 'ADMIN',
      })).toString('base64')
      mockCookies.get.mockReturnValue({ value: forgedToken })
      mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects tampered JWT with modified payload', async () => {
      const tamperedToken = 'header.tamperedPayload.signature'
      mockCookies.get.mockReturnValue({ value: tamperedToken })
      mockJwtVerify.mockRejectedValue(new Error('signature verification failed'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects expired JWT tokens', async () => {
      const expiredToken = 'expired-jwt-token'
      mockCookies.get.mockReturnValue({ value: expiredToken })
      mockJwtVerify.mockRejectedValue(new Error('jwt expired'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
    })

    it('SECURITY: rejects legacy base64 admin sessions', async () => {
      const legacyToken = Buffer.from('some-secret:1234567890').toString('base64')
      mockCookies.get.mockReturnValue({ value: legacyToken })
      mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))

      const request = new NextRequest('http://localhost/api/test')

      const result = await verifyAdminAuth(request)
      expect(result).toBe(false)
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

describe('createSignedToken', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('creates a signed JWT token with userId', async () => {
    const token = await createSignedToken({
      userId: 'user-123',
      email: 'test@example.com',
      role: 'PARTNER' as const,
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    // JWT format: header.payload.signature
    expect(token.split('.')).toHaveLength(3)
  })

  it('creates a signed JWT token with admin role', async () => {
    const token = await createSignedToken({
      userId: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN' as const,
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })

  it('creates token without optional fields', async () => {
    const token = await createSignedToken({})

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
  })
})

describe('validateSessionWithDatabase', () => {
  const { validateSessionWithDatabase } = require('@/lib/auth')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns invalid when session has no userId', async () => {
    const result = await validateSessionWithDatabase({})

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('No user ID in session')
  })

  it('returns invalid when user not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const result = await validateSessionWithDatabase({ userId: 'user-123' })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('User not found')
  })

  it('returns invalid when user is not active', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      isActive: false,
    })

    const result = await validateSessionWithDatabase({ userId: 'user-123' })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Account deactivated')
  })

  it('returns invalid when account is locked', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      isActive: true,
      lockedUntil: new Date(Date.now() + 60000),
    })

    const result = await validateSessionWithDatabase({ userId: 'user-123' })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Account locked')
  })

  it('returns invalid when session version mismatches', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      isActive: true,
      lockedUntil: null,
      sessionVersion: 2,
    })

    const result = await validateSessionWithDatabase({
      userId: 'user-123',
      sessionVersion: 1,
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Session revoked')
  })

  it('returns valid for valid session', async () => {
    const mockUser = {
      id: 'user-123',
      isActive: true,
      lockedUntil: null,
      sessionVersion: 1,
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await validateSessionWithDatabase({
      userId: 'user-123',
      sessionVersion: 1,
    })

    expect(result.valid).toBe(true)
    expect(result.user).toEqual(mockUser)
  })

  it('returns valid when session version is undefined', async () => {
    const mockUser = {
      id: 'user-123',
      isActive: true,
      lockedUntil: null,
      sessionVersion: 5,
    }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const result = await validateSessionWithDatabase({
      userId: 'user-123',
    })

    expect(result.valid).toBe(true)
  })

  it('allows login when lockedUntil is in the past', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      isActive: true,
      lockedUntil: new Date(Date.now() - 60000),
      sessionVersion: 1,
    })

    const result = await validateSessionWithDatabase({
      userId: 'user-123',
      sessionVersion: 1,
    })

    expect(result.valid).toBe(true)
  })
})

describe('verifyAuth', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars' }
    mockCookies.get.mockReturnValue(undefined)
    mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      isActive: true,
      lockedUntil: null,
      sessionVersion: 1,
    })
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('rejects Bearer token (no longer supported)', async () => {
    const { verifyAuth } = require('@/lib/auth')

    const request = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Bearer test-secret-123' },
    })

    const result = await verifyAuth(request)
    expect(result).toBeNull()
  })

  it('returns session from valid JWT cookie', async () => {
    mockCookies.get.mockReturnValue({ value: 'valid-jwt' })
    mockJwtVerify.mockResolvedValue({
      payload: {
        userId: 'user-1',
        email: 'user@example.com',
        role: 'PARTNER',
        sessionVersion: 1,
      },
    })

    const { verifyAuth } = require('@/lib/auth')
    const request = new NextRequest('http://localhost/api/test')

    const result = await verifyAuth(request)

    expect(result).toBeDefined()
    expect(result.userId).toBe('user-1')
  })

  it('returns null when no cookie is set', async () => {
    const { verifyAuth } = require('@/lib/auth')
    const request = new NextRequest('http://localhost/api/test')

    const result = await verifyAuth(request)
    expect(result).toBeNull()
  })
})

describe('verifyPartnerAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.get.mockReturnValue(undefined)
    mockJwtVerify.mockRejectedValue(new Error('Invalid JWT'))
  })

  it('returns null when no session', async () => {
    mockCookies.get.mockReturnValue(undefined)

    const { verifyPartnerAuth } = require('@/lib/auth')
    const request = new NextRequest('http://localhost/api/test')

    const result = await verifyPartnerAuth(request)

    expect(result).toBeNull()
  })
})
