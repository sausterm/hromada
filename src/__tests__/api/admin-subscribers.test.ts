/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { GET, POST, DELETE } from '@/app/api/admin/subscribers/route'
import { verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>

describe('/api/admin/subscribers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/subscribers')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('returns subscribers when authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      const mockSubscribers = [
        { id: '1', email: 'a@test.com', subscribedAt: new Date() },
        { id: '2', email: 'b@test.com', subscribedAt: new Date() },
      ]
      ;(prisma.newsletterSubscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers)

      const request = new NextRequest('http://localhost/api/admin/subscribers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.subscribers)).toBe(true)
      expect(data.subscribers).toHaveLength(2)
    })
  })

  describe('POST', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('returns 400 for missing email', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 for invalid email', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('creates subscriber with valid email', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      const mockSub = { id: '1', email: 'test@test.com', unsubscribed: false }
      ;(prisma.newsletterSubscriber.upsert as jest.Mock).mockResolvedValue(mockSub)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'Test@Test.com' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.subscriber).toEqual(mockSub)
      // Verify email was lowercased and trimmed
      expect(prisma.newsletterSubscriber.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@test.com' },
        })
      )
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      })
      const response = await DELETE(request)

      expect(response.status).toBe(401)
    })

    it('returns 400 when id is missing', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const response = await DELETE(request)

      expect(response.status).toBe(400)
    })

    it('deletes subscriber successfully', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      ;(prisma.newsletterSubscriber.delete as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/admin/subscribers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'sub-1' }),
      })
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.newsletterSubscriber.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      })
    })
  })
})
