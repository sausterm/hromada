/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/donations/confirm/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
    },
    donation: {
      create: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
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
  sendDonorWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendDonationNotificationToAdmin: jest.fn().mockResolvedValue(undefined),
}))

// Mock security
jest.mock('@/lib/security', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
  AuditAction: {
    USER_CREATED: 'USER_CREATED',
    DONATION_CREATED: 'DONATION_CREATED',
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  getUserAgent: jest.fn().mockReturnValue('test-agent'),
}))

import { prisma } from '@/lib/prisma'
import { getUserByEmail } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { sendDonorWelcomeEmail, sendDonationNotificationToAdmin } from '@/lib/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const validDonation = {
  projectId: 'project-1',
  projectName: 'Solar Panel Project',
  paymentMethod: 'wire',
  donorName: 'John Doe',
  donorEmail: 'john@example.com',
  donorOrganization: 'Good Org',
  amount: '5000',
  referenceNumber: 'REF-001',
  message: 'Happy to help!',
}

const mockDonorUser = {
  id: 'user-1',
  email: 'john@example.com',
  name: 'John Doe',
  role: 'DONOR',
  isActive: true,
}

describe('POST /api/donations/confirm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates donation for existing donor', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-1',
      ...validDonation,
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.donationId).toBe('donation-1')
    expect(data.isNewDonor).toBe(false)
  })

  it('creates new donor account when email not found', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-2',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.isNewDonor).toBe(true)
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'john@example.com',
        name: 'John Doe',
        role: 'DONOR',
        isActive: true,
      }),
    })
  })

  it('sends welcome email to new donors', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.user.create as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-3',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    await POST(request)

    expect(sendDonorWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        projectName: 'Solar Panel Project',
        amount: 5000,
        paymentMethod: 'wire',
      })
    )
  })

  it('sends admin notification for all donations', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-4',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    await POST(request)

    expect(sendDonationNotificationToAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        projectName: 'Solar Panel Project',
        projectId: 'project-1',
        paymentMethod: 'wire',
      })
    )
  })

  it('returns 400 when projectId is missing', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, projectId: undefined }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID, donor name, email, and payment method are required')
  })

  it('returns 400 when donorName is missing', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, donorName: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID, donor name, email, and payment method are required')
  })

  it('returns 400 when donorEmail is missing', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, donorEmail: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID, donor name, email, and payment method are required')
  })

  it('returns 400 when paymentMethod is missing', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, paymentMethod: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID, donor name, email, and payment method are required')
  })

  it('returns 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, donorEmail: 'not-valid' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 400 for invalid payment method', async () => {
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, paymentMethod: 'bitcoin' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid payment method')
  })

  it('accepts all valid payment methods', async () => {
    const validMethods = ['wire', 'daf', 'check', 'ach']

    for (const method of validMethods) {
      jest.clearAllMocks()
      ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
      ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
        id: `donation-${method}`,
      })

      const request = new NextRequest('http://localhost/api/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validDonation, paymentMethod: method }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    }
  })

  it('normalizes email to lowercase', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-5',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, donorEmail: '  John@Example.COM  ' }),
    })

    await POST(request)

    expect(getUserByEmail).toHaveBeenCalledWith('john@example.com')
    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        donorEmail: 'john@example.com',
      }),
    })
  })

  it('maps payment method to enum correctly', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-6',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, paymentMethod: 'WIRE' }),
    })

    await POST(request)

    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        paymentMethod: 'WIRE',
      }),
    })
  })

  it('sets projectId to null for general donations', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-7',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validDonation, projectId: 'general' }),
    })

    await POST(request)

    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: null,
      }),
    })
  })

  it('handles optional amount as null when not provided', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-8',
    })

    const { amount, ...donationWithoutAmount } = validDonation
    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donationWithoutAmount),
    })

    await POST(request)

    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: null,
      }),
    })
  })

  it('sets donation status to PENDING_CONFIRMATION', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-9',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    await POST(request)

    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'PENDING_CONFIRMATION',
      }),
    })
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    ;(getUserByEmail as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validDonation),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to record confirmation. Please try again.')
  })

  it('trims donor name and organization', async () => {
    ;(getUserByEmail as jest.Mock).mockResolvedValue(mockDonorUser)
    ;(mockPrisma.donation.create as jest.Mock).mockResolvedValue({
      id: 'donation-10',
    })

    const request = new NextRequest('http://localhost/api/donations/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validDonation,
        donorName: '  John Doe  ',
        donorOrganization: '  Good Org  ',
      }),
    })

    await POST(request)

    expect(mockPrisma.donation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        donorName: 'John Doe',
        donorOrganization: 'Good Org',
      }),
    })
  })
})
