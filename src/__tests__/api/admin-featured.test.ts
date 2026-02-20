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
    featuredProject: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { GET, PUT } from '@/app/api/admin/featured/route'
import { verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>

describe('/api/admin/featured', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/featured')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns featured projects when authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      const mockFeatured = [
        { slot: 1, projectId: 'p1', project: { id: 'p1', facilityName: 'Test' } },
      ]
      ;(prisma.featuredProject.findMany as jest.Mock).mockResolvedValue(mockFeatured)

      const request = new NextRequest('http://localhost/api/admin/featured')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.featured).toEqual(mockFeatured)
    })
  })

  describe('PUT', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [] }),
      })
      const response = await PUT(request)

      expect(response.status).toBe(401)
    })

    it('returns 400 when slots is not an array', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: 'not-array' }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('array')
    })

    it('returns 400 when slots exceed 4', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const slots = Array.from({ length: 5 }, (_, i) => ({ slot: i + 1, projectId: `p${i}` }))
      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 for missing slot or projectId', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [{ slot: 1 }] }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('slot and projectId')
    })

    it('returns 400 for invalid slot numbers', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [{ slot: 5, projectId: 'p1' }] }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Slot must be 1-4')
    })

    it('returns 400 for duplicate slots', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: [
            { slot: 1, projectId: 'p1' },
            { slot: 1, projectId: 'p2' },
          ],
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Duplicate slot')
    })

    it('returns 400 for duplicate projects', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: [
            { slot: 1, projectId: 'p1' },
            { slot: 2, projectId: 'p1' },
          ],
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Same project')
    })

    it('returns 400 when referenced projects not found', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [{ slot: 1, projectId: 'nonexistent' }] }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('not found')
    })

    it('updates featured projects successfully', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      ;(prisma.project.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue(undefined)

      const mockResult = [
        { slot: 1, projectId: 'p1', project: { id: 'p1' } },
        { slot: 2, projectId: 'p2', project: { id: 'p2' } },
      ]
      ;(prisma.featuredProject.findMany as jest.Mock).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: [
            { slot: 1, projectId: 'p1' },
            { slot: 2, projectId: 'p2' },
          ],
        }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.featured).toEqual(mockResult)
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('handles empty slots array (clear all featured)', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      ;(prisma.$transaction as jest.Mock).mockResolvedValue(undefined)
      ;(prisma.featuredProject.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/admin/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: [] }),
      })
      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.featured).toEqual([])
    })
  })
})
