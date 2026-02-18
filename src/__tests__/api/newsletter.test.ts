/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/newsletter/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
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
  sendNewsletterWelcomeEmail: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('subscribes a new email successfully', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'john@example.com',
      unsubscribed: false,
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('normalizes email to lowercase and trims whitespace', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'john@example.com',
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '  John@Example.COM  ' }),
    })

    await POST(request)

    expect(mockPrisma.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
    })
    expect(mockPrisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
      update: { unsubscribed: false },
      create: { email: 'john@example.com' },
    })
  })

  it('sends welcome email for new subscribers', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'new@example.com',
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com' }),
    })

    await POST(request)

    expect(sendNewsletterWelcomeEmail).toHaveBeenCalledWith('new@example.com')
  })

  it('sends welcome email for re-subscribing (previously unsubscribed)', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'returning@example.com',
      unsubscribed: true,
    })
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'returning@example.com',
      unsubscribed: false,
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'returning@example.com' }),
    })

    await POST(request)

    expect(sendNewsletterWelcomeEmail).toHaveBeenCalledWith('returning@example.com')
  })

  it('does not send welcome email for already-subscribed users', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      unsubscribed: false,
    })
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'existing@example.com',
      unsubscribed: false,
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'existing@example.com' }),
    })

    await POST(request)

    expect(sendNewsletterWelcomeEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email required')
  })

  it('returns 400 when email is empty string', async () => {
    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email required')
  })

  it('returns 400 when email is not a string', async () => {
    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 123 }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email required')
  })

  it('returns 400 when email has no @ symbol', async () => {
    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid email required')
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB error')
    )

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('upserts to re-subscribe previously unsubscribed users', async () => {
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'returning@example.com',
      unsubscribed: true,
    })
    ;(mockPrisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'returning@example.com',
      unsubscribed: false,
    })

    const request = new NextRequest('http://localhost/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'returning@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.newsletterSubscriber.upsert).toHaveBeenCalledWith({
      where: { email: 'returning@example.com' },
      update: { unsubscribed: false },
      create: { email: 'returning@example.com' },
    })
  })
})
