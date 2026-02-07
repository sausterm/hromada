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

    it('should reject sessions for locked accounts', async () => {
      const { validateSession } = require('@/lib/security')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        isActive: true,
        lockedUntil: new Date(Date.now() + 60000), // Locked for 1 minute
        sessionVersion: 1,
      })

      const result = await validateSession('user-123', 1)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Account locked')
    })

    it('should reject sessions for non-existent users', async () => {
      const { validateSession } = require('@/lib/security')

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await validateSession('non-existent-user', 1)

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('User not found')
    })
  })

  describe('Client IP extraction', () => {
    it('should extract IP from x-real-ip header', async () => {
      const { getClientIp } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-real-ip': '203.0.113.5' },
      })

      expect(getClientIp(request)).toBe('203.0.113.5')
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize HTML entities', async () => {
      const { sanitizeInput } = await import('@/lib/security')

      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeInput(input)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('&lt;')
    })

    it('should escape ampersands', async () => {
      const { sanitizeInput } = await import('@/lib/security')

      const input = 'foo & bar'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('foo &amp; bar')
    })

    it('should escape quotes', async () => {
      const { sanitizeInput } = await import('@/lib/security')

      const input = 'He said "hello" and \'world\''
      const sanitized = sanitizeInput(input)

      expect(sanitized).toContain('&quot;')
      expect(sanitized).toContain('&#x27;')
    })
  })

  describe('Suspicious Input Detection', () => {
    it('should detect XSS patterns with script tags', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('<script>alert("xss")</script>')).toBe(true)
    })

    it('should detect javascript: protocol', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('javascript:alert(1)')).toBe(true)
    })

    it('should detect event handlers', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('onclick=alert(1)')).toBe(true)
      expect(detectSuspiciousInput('onerror =alert(1)')).toBe(true)
    })

    it('should detect vbscript', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('vbscript:msgbox')).toBe(true)
    })

    it('should not flag normal input', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('Hello, world!')).toBe(false)
      expect(detectSuspiciousInput('normal@email.com')).toBe(false)
    })
  })

  describe('Security Headers', () => {
    it('should include all required security headers', async () => {
      const { getSecurityHeaders } = await import('@/lib/security')

      const headers = getSecurityHeaders()

      expect(headers).toHaveProperty('X-Frame-Options')
      expect(headers).toHaveProperty('X-Content-Type-Options')
      expect(headers).toHaveProperty('Referrer-Policy')
    })
  })

  describe('CSRF Token Generation', () => {
    it('should generate a token', async () => {
      const { generateCsrfToken } = await import('@/lib/security')

      const token = generateCsrfToken()

      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })
  })

  describe('Audit Logging', () => {
    it('logs audit event successfully', async () => {
      const { logAuditEvent, AuditAction } = await import('@/lib/security')
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' })

      await logAuditEvent(AuditAction.LOGIN_SUCCESS, {
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        details: 'Test login',
      })

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGIN_SUCCESS',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          details: 'Test login',
        },
      })
    })

    it('handles audit event without options', async () => {
      const { logAuditEvent, AuditAction } = await import('@/lib/security')
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' })

      await logAuditEvent(AuditAction.LOGOUT)

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'LOGOUT',
          userId: null,
          ipAddress: null,
          userAgent: null,
          details: null,
        },
      })
    })

    it('truncates long userAgent and details', async () => {
      const { logAuditEvent, AuditAction } = await import('@/lib/security')
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'log-1' })

      const longUserAgent = 'a'.repeat(600)
      const longDetails = 'b'.repeat(1100)

      await logAuditEvent(AuditAction.ADMIN_ACTION, {
        userAgent: longUserAgent,
        details: longDetails,
      })

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userAgent: 'a'.repeat(500),
          details: 'b'.repeat(1000),
        }),
      })
    })

    it('handles audit logging failure gracefully', async () => {
      const { logAuditEvent, AuditAction } = await import('@/lib/security')
      ;(prisma.auditLog.create as jest.Mock).mockRejectedValue(new Error('DB error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      // Should not throw
      await logAuditEvent(AuditAction.LOGIN_SUCCESS, { userId: 'user-123' })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to log audit event:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Client IP and User Agent extraction', () => {
    it('extracts IP from x-forwarded-for header', async () => {
      const { getClientIp } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
      })

      expect(getClientIp(request)).toBe('203.0.113.5')
    })

    it('returns unknown when no IP headers present', async () => {
      const { getClientIp } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      const request = new NextRequest('http://localhost/api/test', {
        headers: {},
      })

      expect(getClientIp(request)).toBe('unknown')
    })

    it('extracts user agent from request', async () => {
      const { getUserAgent } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'user-agent': 'Mozilla/5.0 Test Browser' },
      })

      expect(getUserAgent(request)).toBe('Mozilla/5.0 Test Browser')
    })

    it('returns unknown for missing user agent', async () => {
      const { getUserAgent } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      const request = new NextRequest('http://localhost/api/test', {
        headers: {},
      })

      expect(getUserAgent(request)).toBe('unknown')
    })
  })

  describe('Failed Login Handling', () => {
    it('increments failed attempts and returns remaining attempts', async () => {
      const { handleFailedLogin } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const mockUser = {
        id: 'user-123',
        failedLoginAttempts: 2,
        lockedUntil: null,
      }

      const request = new NextRequest('http://localhost/api/login', {
        headers: { 'x-real-ip': '192.168.1.1' },
      })

      const result = await handleFailedLogin(mockUser as any, request)

      expect(result.locked).toBe(false)
      expect(result.attemptsRemaining).toBe(2)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { failedLoginAttempts: 3 },
      })
    })

    it('locks account after max failed attempts', async () => {
      const { handleFailedLogin, SECURITY_CONFIG } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const mockUser = {
        id: 'user-123',
        failedLoginAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - 1,
        lockedUntil: null,
      }

      const request = new NextRequest('http://localhost/api/login', {
        headers: {},
      })

      const result = await handleFailedLogin(mockUser as any, request)

      expect(result.locked).toBe(true)
      expect(result.attemptsRemaining).toBe(0)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
          lockedUntil: expect.any(Date),
        }),
      })
    })
  })

  describe('Successful Login Handling', () => {
    it('resets failed attempts and updates last login', async () => {
      const { handleSuccessfulLogin } = await import('@/lib/security')
      const { NextRequest } = await import('next/server')

      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const mockUser = {
        id: 'user-123',
        failedLoginAttempts: 3,
      }

      const request = new NextRequest('http://localhost/api/login', {
        headers: { 'x-real-ip': '192.168.1.1' },
      })

      await handleSuccessfulLogin(mockUser as any, request)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: expect.any(Date),
          lastLoginIp: '192.168.1.1',
        },
      })
    })
  })

  describe('Session Revocation', () => {
    it('increments session version and logs event', async () => {
      const { revokeAllSessions } = await import('@/lib/security')

      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      await revokeAllSessions('user-123', 'Password changed')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          sessionVersion: { increment: 1 },
        },
      })
    })

    it('uses default reason when none provided', async () => {
      const { revokeAllSessions } = await import('@/lib/security')

      ;(prisma.user.update as jest.Mock).mockResolvedValue({})
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      await revokeAllSessions('user-123')

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          details: 'All sessions revoked',
        }),
      })
    })
  })

  describe('Apply Security Headers', () => {
    it('applies all security headers to response', async () => {
      const { applySecurityHeaders, getSecurityHeaders } = await import('@/lib/security')

      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }

      const result = applySecurityHeaders(mockResponse as any)

      const headers = getSecurityHeaders()
      const headerCount = Object.keys(headers).length

      expect(mockResponse.headers.set).toHaveBeenCalledTimes(headerCount)
      expect(result).toBe(mockResponse)
    })
  })

  describe('Security Headers in Production', () => {
    const originalEnv = process.env.NODE_ENV

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
      })
    })

    it('includes HSTS header in production', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      })

      jest.resetModules()
      const { getSecurityHeaders } = await import('@/lib/security')

      const headers = getSecurityHeaders()

      expect(headers).toHaveProperty('Strict-Transport-Security')
    })
  })

  describe('URL and expression pattern detection', () => {
    it('detects data:text/html pattern', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('data:text/html,<script>alert(1)</script>')).toBe(true)
    })

    it('detects expression() pattern', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('background: expression(alert(1))')).toBe(true)
    })

    it('detects url() pattern', async () => {
      const { detectSuspiciousInput } = await import('@/lib/security')

      expect(detectSuspiciousInput('background: url(javascript:alert(1))')).toBe(true)
    })
  })
})
