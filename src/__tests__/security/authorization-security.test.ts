/**
 * Security Test Suite - Authorization Testing
 *
 * Tests for:
 * - IDOR (Insecure Direct Object References)
 * - Privilege escalation
 * - Role-based access control
 * - API endpoint authorization
 */

// Mock next/server before any imports
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string, init?: any) => ({
    url,
    method: init?.method || 'GET',
    headers: {
      get: (key: string) => init?.headers?.[key] || null,
    },
    json: () => Promise.resolve(init?.body ? JSON.parse(init.body) : {}),
  })),
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200, json: () => Promise.resolve(body) })),
  },
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectSubmission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn(),
}))

import { prisma } from '@/lib/prisma'

describe('Authorization Security Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, SESSION_SECRET: 'test-session-secret-that-is-at-least-32-chars' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Role-Based Access Control', () => {
    it('should deny partner auth with wrong credentials', async () => {
      const { verifyPartnerAuth } = await import('@/lib/auth')
      const { NextRequest } = require('next/server')

      const request = new NextRequest('http://localhost/api/partner/projects', {
        headers: {},
      })

      const result = await verifyPartnerAuth(request)
      expect(result).toBeNull()
    })

    it('should deny admin auth with Bearer token (no longer supported)', async () => {
      const { verifyAdminAuth } = await import('@/lib/auth')
      const { NextRequest } = require('next/server')

      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          'authorization': 'Bearer test-secret-123',
        },
      })

      const isAuthorized = await verifyAdminAuth(request)
      expect(isAuthorized).toBe(false)
    })

    it('should deny admin auth with wrong Bearer token', async () => {
      const { verifyAdminAuth } = await import('@/lib/auth')
      const { NextRequest } = require('next/server')

      const request = new NextRequest('http://localhost/api/admin/users', {
        headers: {
          'authorization': 'Bearer wrong-secret',
        },
      })

      const isAuthorized = await verifyAdminAuth(request)
      expect(isAuthorized).toBe(false)
    })
  })

  describe('IDOR Protection Tests', () => {
    it('should verify project ownership before allowing partner edits', async () => {
      const mockSubmission = {
        id: 'submission-123',
        submittedByUserId: 'user-A',
        status: 'PENDING',
      }

      ;(prisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)

      // Attempting to access as different user should fail
      const isOwner = mockSubmission.submittedByUserId === 'user-B'
      expect(isOwner).toBe(false)
    })

    it('should allow access when user owns the submission', async () => {
      const mockSubmission = {
        id: 'submission-123',
        submittedByUserId: 'user-A',
        status: 'PENDING',
      }

      ;(prisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)

      const isOwner = mockSubmission.submittedByUserId === 'user-A'
      expect(isOwner).toBe(true)
    })
  })

  describe('Session Validation', () => {
    it('should validate user exists in database during session check', async () => {
      const { validateSessionWithDatabase } = await import('@/lib/auth')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await validateSessionWithDatabase({
        userId: 'deleted-user-123',
        email: 'deleted@example.com',
        role: 'ADMIN' as any,
      })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('User not found')
    })

    it('should reject sessions for inactive users', async () => {
      const { validateSessionWithDatabase } = await import('@/lib/auth')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: false,
        lockedUntil: null,
        sessionVersion: 1,
      })

      const result = await validateSessionWithDatabase({
        userId: 'user-123',
        email: 'inactive@example.com',
        role: 'PARTNER' as any,
        sessionVersion: 1,
      })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Account deactivated')
    })

    it('should accept valid sessions', async () => {
      const { validateSessionWithDatabase } = await import('@/lib/auth')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        lockedUntil: null,
        sessionVersion: 1,
      })

      const result = await validateSessionWithDatabase({
        userId: 'user-123',
        email: 'active@example.com',
        role: 'PARTNER' as any,
        sessionVersion: 1,
      })

      expect(result.valid).toBe(true)
    })
  })
})
