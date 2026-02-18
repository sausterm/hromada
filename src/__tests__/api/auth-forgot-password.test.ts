/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/forgot-password/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getUserByEmail: jest.fn(),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
  RATE_LIMITS: {
    contact: { limit: 5, windowSeconds: 60 },
  },
}))

// Mock email
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
}))

// Mock security
jest.mock('@/lib/security', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
  AuditAction: {
    PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  getUserAgent: jest.fn().mockReturnValue('test-agent'),
}))

import { prisma } from '@/lib/prisma'
import { getUserByEmail } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'
import { logAuditEvent } from '@/lib/security'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const mockUser = {
  id: 'user-1',
  email: 'john@example.com',
  name: 'John Doe',
  isActive: true,
  role: 'DONOR',
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends reset code for valid active user', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      code: '123456',
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('invalidates existing unused tokens before creating new one', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-2',
      userId: 'user-1',
      code: '654321',
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    await POST(request)

    expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', usedAt: null },
    })
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
      }),
    })
  })

  it('creates token with 15-minute expiration', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-3',
    })

    const now = Date.now()
    jest.spyOn(Date, 'now').mockReturnValue(now)

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    await POST(request)

    const createCall = (mockPrisma.passwordResetToken.create as jest.Mock).mock.calls[0][0]
    const expiresAt = createCall.data.expiresAt as Date
    const expectedExpiry = new Date(now + 15 * 60 * 1000)

    // Allow 1 second tolerance
    expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000)

    jest.restoreAllMocks()
  })

  it('sends password reset email with correct parameters', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-4',
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    await POST(request)

    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      code: expect.any(String),
    })
  })

  it('logs audit event on successful reset request', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-5',
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    await POST(request)

    expect(logAuditEvent).toHaveBeenCalledWith('PASSWORD_RESET_REQUESTED', {
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })
  })

  it('returns success even when email is not found (prevents enumeration)', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Should not create a token or send an email
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('returns success for inactive user (prevents enumeration)', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue({
      ...mockUser,
      isActive: false,
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
    expect(sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('returns 400 when email is not a string', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 123 }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('trims email before looking up user', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '  john@example.com  ' }),
    })

    await POST(request)

    expect(getUserByEmail).toHaveBeenCalledWith('john@example.com')
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on unexpected error', async () => {
    ;(getUserByEmail as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An unexpected error occurred')
  })

  it('generates a 6-digit OTP code', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockUser)
    ;(mockPrisma.passwordResetToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
    ;(mockPrisma.passwordResetToken.create as jest.Mock).mockResolvedValue({
      id: 'token-6',
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    await POST(request)

    const createCall = (mockPrisma.passwordResetToken.create as jest.Mock).mock.calls[0][0]
    const code = createCall.data.code

    expect(code).toMatch(/^\d{6}$/)
  })
})
