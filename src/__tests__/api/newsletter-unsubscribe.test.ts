/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock drip
const mockCancelAllEnrollments = jest.fn()
jest.mock('@/lib/drip', () => ({
  cancelAllEnrollments: (...args: unknown[]) => mockCancelAllEnrollments(...args),
}))

import { GET, POST } from '@/app/api/newsletter/unsubscribe/route'
import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  newsletterSubscriber: {
    findUnique: jest.Mock
    update: jest.Mock
  }
}

function createRequest(url: string, method: string, body?: object) {
  const req = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return req
}

describe('newsletter unsubscribe route', () => {
  const mockSubscriber = {
    id: 'sub-1',
    email: 'user@example.com',
    unsubscribeToken: 'valid-token',
    unsubscribed: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.newsletterSubscriber.update.mockResolvedValue({})
    mockCancelAllEnrollments.mockResolvedValue(2)
  })

  describe('GET (token-based one-click)', () => {
    it('unsubscribes subscriber with valid token', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(mockSubscriber)

      const req = createRequest('/api/newsletter/unsubscribe?token=valid-token', 'GET')
      const res = await GET(req)

      // Should redirect on success
      expect(res.status).toBe(307)
      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { unsubscribed: true },
      })
    })

    it('calls cancelAllEnrollments on success', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(mockSubscriber)

      const req = createRequest('/api/newsletter/unsubscribe?token=valid-token', 'GET')
      await GET(req)

      expect(mockCancelAllEnrollments).toHaveBeenCalledWith('user@example.com')
    })

    it('returns 400 for missing token', async () => {
      const req = createRequest('/api/newsletter/unsubscribe', 'GET')
      const res = await GET(req)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Token is required')
    })

    it('returns 404 for invalid token', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null)

      const req = createRequest('/api/newsletter/unsubscribe?token=bad-token', 'GET')
      const res = await GET(req)

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Invalid token')
    })

    it('returns 500 on database error', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockRejectedValue(new Error('DB down'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const req = createRequest('/api/newsletter/unsubscribe?token=valid-token', 'GET')
      const res = await GET(req)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Unsubscribe failed')
      consoleSpy.mockRestore()
    })

    it('returns already unsubscribed message if already unsubscribed', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue({
        ...mockSubscriber,
        unsubscribed: true,
      })

      const req = createRequest('/api/newsletter/unsubscribe?token=valid-token', 'GET')
      const res = await GET(req)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.message).toBe('Already unsubscribed')
      expect(mockPrisma.newsletterSubscriber.update).not.toHaveBeenCalled()
    })
  })

  describe('POST (form-based)', () => {
    it('unsubscribes by token', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(mockSubscriber)

      const req = createRequest('/api/newsletter/unsubscribe', 'POST', { token: 'valid-token' })
      const res = await POST(req)

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { unsubscribed: true },
      })
    })

    it('calls cancelAllEnrollments on success', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(mockSubscriber)

      const req = createRequest('/api/newsletter/unsubscribe', 'POST', { token: 'valid-token' })
      await POST(req)

      expect(mockCancelAllEnrollments).toHaveBeenCalledWith('user@example.com')
    })

    it('returns 400 for missing token', async () => {
      const req = createRequest('/api/newsletter/unsubscribe', 'POST', {})
      const res = await POST(req)

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Token is required')
    })

    it('returns 404 for invalid token', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockResolvedValue(null)

      const req = createRequest('/api/newsletter/unsubscribe', 'POST', { token: 'bad-token' })
      const res = await POST(req)

      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Invalid token')
    })

    it('returns 500 on database error', async () => {
      mockPrisma.newsletterSubscriber.findUnique.mockRejectedValue(new Error('DB down'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const req = createRequest('/api/newsletter/unsubscribe', 'POST', { token: 'valid-token' })
      const res = await POST(req)

      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('Unsubscribe failed')
      consoleSpy.mockRestore()
    })
  })
})
