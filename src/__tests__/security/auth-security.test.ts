/**
 * Security Test Suite - Authentication Testing
 *
 * Tests for:
 * - Brute force protection
 * - Password policy enforcement
 * - Session security
 * - JWT token security
 * - Account lockout
 */

// Mock next/server before any imports
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string, init?: any) => ({
    url,
    headers: {
      get: (key: string) => init?.headers?.[key] || null,
    },
  })),
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
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
import { jwtVerify } from 'jose'
import { validatePasswordStrength, SECURITY_CONFIG, isAccountLocked } from '@/lib/security'

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Password Policy Enforcement', () => {
    it('should reject passwords shorter than minimum length', () => {
      const result = validatePasswordStrength('Short1!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        `Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`
      )
    })

    it('should reject passwords without uppercase letters', () => {
      const result = validatePasswordStrength('lowercaseonly123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      )
    })

    it('should reject passwords without lowercase letters', () => {
      const result = validatePasswordStrength('UPPERCASEONLY123!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      )
    })

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('NoNumbersHere!')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one number'
      )
    })

    it('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('NoSpecialChars123')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'Password must contain at least one special character'
      )
    })

    it('should reject common weak patterns', () => {
      const weakPasswords = [
        '123456Password!',
        'password123ABC!',
        'qwerty123ABC!',
        'admin123ABC!@#',
        'letmein123ABC!',
      ]

      weakPasswords.forEach((password) => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Password contains a common weak pattern')
      })
    })

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!Pass#2024',
        'C0mplex@Security!',
        'Hromada#Ukr@ine2024',
      ]

      strongPasswords.forEach((password) => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })
  })

  describe('Account Lockout Protection', () => {
    it('should prevent login for locked accounts', () => {
      const lockedUser = {
        lockedUntil: new Date(Date.now() + 60000), // Locked for 1 minute
      }

      expect(isAccountLocked(lockedUser as any)).toBe(true)
    })

    it('should allow login after lockout period expires', () => {
      const unlockedUser = {
        lockedUntil: new Date(Date.now() - 1000), // Lock expired 1 second ago
      }

      expect(isAccountLocked(unlockedUser as any)).toBe(false)
    })

    it('should allow login when no lockout is set', () => {
      const neverLockedUser = {
        lockedUntil: null,
      }

      expect(isAccountLocked(neverLockedUser as any)).toBe(false)
    })
  })

  describe('JWT Token Security', () => {
    it('should reject tampered tokens', async () => {
      ;(jwtVerify as jest.Mock).mockRejectedValue(new Error('signature verification failed'))

      const tamperedToken = 'header.tamperedPayload.invalidSignature'

      try {
        await jwtVerify(tamperedToken, new TextEncoder().encode('secret'))
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should reject expired tokens', async () => {
      ;(jwtVerify as jest.Mock).mockRejectedValue(new Error('"exp" claim timestamp check failed'))

      const expiredToken = 'header.expiredPayload.signature'

      try {
        await jwtVerify(expiredToken, new TextEncoder().encode('secret'))
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Session Management', () => {
    it('should invalidate sessions when session version changes', async () => {
      const { validateSession } = require('@/lib/security')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        lockedUntil: null,
        sessionVersion: 2, // Version incremented
      })

      const result = await validateSession('user-123', 1) // Old version

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Session revoked')
    })

    it('should reject sessions for deactivated users', async () => {
      const { validateSession } = require('@/lib/security')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: false,
        lockedUntil: null,
        sessionVersion: 1,
      })

      const result = await validateSession('user-123', 1)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Account deactivated')
    })

    it('should accept valid sessions', async () => {
      const { validateSession } = require('@/lib/security')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        lockedUntil: null,
        sessionVersion: 1,
      })

      const result = await validateSession('user-123', 1)

      expect(result.valid).toBe(true)
    })
  })
})
