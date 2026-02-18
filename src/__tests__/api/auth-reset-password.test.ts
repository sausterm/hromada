/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/reset-password/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getUserByEmail: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('new-hashed-password'),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
  RATE_LIMITS: {
    contact: { limit: 5, windowSeconds: 60 },
  },
}))

// Mock security
jest.mock('@/lib/security', () => ({
  validatePasswordStrength: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
  AuditAction: {
    PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  getUserAgent: jest.fn().mockReturnValue('test-agent'),
  revokeAllSessions: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { getUserByEmail, hashPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { validatePasswordStrength, logAuditEvent } from '@/lib/security'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const mockUser = {
  id: 'user-1',
  email: 'john@example.com',
  name: 'John Doe',
  isActive: true,
  role: 'DONOR',
}

const mockToken = {
  id: 'token-1',
  userId: 'user-1',
  code: '123456',
  usedAt: null,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min in future
}

const validResetPayload = {
  email: 'john@example.com',
  code: '123456',
  newPassword: 'Str0ng!Passw0rd#2024',
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.$transaction as jest.Mock).mockResolvedValue(undefined)
    ;(mockPrisma.user.update as jest.Mock).mockResolvedValue({})
    ;(mockPrisma.passwordResetToken.update as jest.Mock).mockResolvedValue({})
  })

  it('resets password successfully with valid code and strong password', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('hashes the new password before saving', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(hashPassword).toHaveBeenCalledWith('Str0ng!Passw0rd#2024')
  })

  it('uses a transaction to update password and mark token used', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('logs audit event on successful password reset', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(logAuditEvent).toHaveBeenCalledWith('PASSWORD_RESET_COMPLETED', {
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })
  })

  it('returns 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '123456', newPassword: 'Str0ng!Pass#2024' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, code, and new password are required')
  })

  it('returns 400 when code is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com', newPassword: 'Str0ng!Pass#2024' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, code, and new password are required')
  })

  it('returns 400 when newPassword is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com', code: '123456' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email, code, and new password are required')
  })

  it('returns 400 when user not found', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid or expired reset code')
  })

  it('returns 400 when token not found', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid or expired reset code')
  })

  it('looks up token with correct criteria (unused, not expired, matching code)', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(mockPrisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        code: '123456',
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
    })
  })

  it('returns 400 when password is too weak', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)
    ;(validatePasswordStrength as jest.Mock).mockReturnValueOnce({
      valid: false,
      errors: ['Password must be at least 12 characters'],
    })

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validResetPayload,
        newPassword: 'weak',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password too weak')
    expect(data.details).toEqual(['Password must be at least 12 characters'])
  })

  it('validates password strength before proceeding', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(validatePasswordStrength).toHaveBeenCalledWith('Str0ng!Passw0rd#2024')
  })

  it('trims email and code before lookup', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '  john@example.com  ',
        code: '  123456  ',
        newPassword: 'Str0ng!Passw0rd#2024',
      }),
    })

    await POST(request)

    expect(getUserByEmail).toHaveBeenCalledWith('john@example.com')
    expect(mockPrisma.passwordResetToken.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        code: '123456',
      }),
    })
  })

  it('does not create transaction when password validation fails', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockToken)
    ;(validatePasswordStrength as jest.Mock).mockReturnValueOnce({
      valid: false,
      errors: ['Too short'],
    })

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on unexpected error', async () => {
    ;(getUserByEmail as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An unexpected error occurred')
  })

  it('does not log audit event when token is invalid', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(logAuditEvent).not.toHaveBeenCalled()
  })

  it('does not log audit event when user not found', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validResetPayload),
    })

    await POST(request)

    expect(logAuditEvent).not.toHaveBeenCalled()
  })
})
