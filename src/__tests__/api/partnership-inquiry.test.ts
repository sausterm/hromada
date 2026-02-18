/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/partnership-inquiry/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    partnershipInquiry: {
      create: jest.fn(),
    },
  },
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
  RATE_LIMITS: {
    partnershipInquiry: { limit: 5, windowSeconds: 60 },
  },
}))

// Mock email
jest.mock('@/lib/email', () => ({
  sendPartnershipInquiryNotification: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { sendPartnershipInquiryNotification } from '@/lib/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const validInquiry = {
  communityName: 'Rotary Club of Portland',
  contactName: 'Jane Smith',
  contactEmail: 'jane@rotary-portland.org',
  communityType: 'rotary',
  approximateSize: '50-100 members',
  message: 'We would like to partner with a Ukrainian municipality.',
}

describe('POST /api/partnership-inquiry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a partnership inquiry with valid data', async () => {
    const createdInquiry = { id: 'inquiry-1', ...validInquiry }
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue(createdInquiry)

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.inquiry).toEqual(createdInquiry)
  })

  it('sends email notification on successful inquiry', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
      id: 'inquiry-2',
      ...validInquiry,
    })

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    await POST(request)

    expect(sendPartnershipInquiryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        communityName: 'Rotary Club of Portland',
        contactName: 'Jane Smith',
        contactEmail: 'jane@rotary-portland.org',
        communityType: 'rotary',
      })
    )
  })

  it('returns 400 when communityName is missing', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, communityName: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Community name is required')
  })

  it('returns 400 when communityName is whitespace only', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, communityName: '   ' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Community name is required')
  })

  it('returns 400 when contactName is missing', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, contactName: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Contact name is required')
  })

  it('returns 400 when contactEmail is missing', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, contactEmail: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email is required')
  })

  it('returns 400 when contactEmail is invalid format', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, contactEmail: 'not-an-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email is required')
  })

  it('returns 400 when communityType is missing', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, communityType: undefined }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid community type is required')
  })

  it('returns 400 when communityType is invalid', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, communityType: 'invalid_type' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid community type is required')
  })

  it('accepts all valid community types', async () => {
    const validTypes = ['rotary', 'city_council', 'faith', 'school', 'diaspora', 'corporate', 'other']

    for (const communityType of validTypes) {
      jest.clearAllMocks()
      ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
        id: `inquiry-${communityType}`,
        ...validInquiry,
        communityType,
      })

      const request = new NextRequest('http://localhost/api/partnership-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validInquiry, communityType }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    }
  })

  it('returns 400 when message exceeds 2000 characters', async () => {
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validInquiry,
        message: 'a'.repeat(2001),
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message must be 2000 characters or less')
  })

  it('allows message at exactly 2000 characters', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
      id: 'inquiry-long',
      ...validInquiry,
      message: 'a'.repeat(2000),
    })

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validInquiry,
        message: 'a'.repeat(2000),
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('trims fields and lowercases email', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
      id: 'inquiry-trim',
    })

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validInquiry,
        communityName: '  Rotary Club  ',
        contactName: '  Jane Smith  ',
        contactEmail: '  Jane@Example.COM  ',
        message: '  Hello  ',
      }),
    })

    await POST(request)

    expect(mockPrisma.partnershipInquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        communityName: 'Rotary Club',
        contactName: 'Jane Smith',
        contactEmail: 'jane@example.com',
        message: 'Hello',
      }),
    })
  })

  it('handles optional approximateSize as null when not provided', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
      id: 'inquiry-no-size',
    })

    const { approximateSize, ...inquiryWithoutSize } = validInquiry
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryWithoutSize),
    })

    await POST(request)

    expect(mockPrisma.partnershipInquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        approximateSize: null,
      }),
    })
  })

  it('handles optional message as null when not provided', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockResolvedValue({
      id: 'inquiry-no-msg',
    })

    const { message, ...inquiryWithoutMessage } = validInquiry
    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryWithoutMessage),
    })

    await POST(request)

    expect(mockPrisma.partnershipInquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        message: null,
      }),
    })
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    ;(mockPrisma.partnershipInquiry.create as jest.Mock).mockRejectedValue(
      new Error('DB error')
    )

    const request = new NextRequest('http://localhost/api/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit partnership inquiry')
  })
})
