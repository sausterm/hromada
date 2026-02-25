/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dripSequence: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    dripEnrollment: {
      findMany: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
  RATE_LIMITS: {},
}))

import { GET, POST } from '@/app/api/admin/drips/route'
import { PATCH } from '@/app/api/admin/drips/[id]/route'
import { GET as getEnrollments } from '@/app/api/admin/drips/[id]/enrollments/route'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

const mockPrisma = prisma as unknown as {
  dripSequence: {
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
  dripEnrollment: { findMany: jest.Mock }
}
const mockVerifyAdmin = verifyAdminAuth as jest.Mock

function makeRequest(url: string, method: string, body?: object) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }
      : {}),
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('admin drips routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAdmin.mockResolvedValue(true)
  })

  // --- GET /api/admin/drips ---
  describe('GET /api/admin/drips', () => {
    it('returns list of sequences', async () => {
      const sequences = [{ id: 's1', name: 'Welcome', steps: [] }]
      mockPrisma.dripSequence.findMany.mockResolvedValue(sequences)

      const res = await GET(makeRequest('/api/admin/drips', 'GET'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.sequences).toEqual(sequences)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await GET(makeRequest('/api/admin/drips', 'GET'))

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.dripSequence.findMany.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await GET(makeRequest('/api/admin/drips', 'GET'))

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- POST /api/admin/drips ---
  describe('POST /api/admin/drips', () => {
    const validBody = {
      name: 'Welcome Drip',
      trigger: 'NEW_SUBSCRIBER',
      steps: [{ delayDays: 1, subject: 'Day 1', htmlContent: '<p>Hi</p>' }],
    }

    it('creates a drip sequence with steps', async () => {
      const created = { id: 's1', ...validBody, steps: [{ stepOrder: 1 }] }
      mockPrisma.dripSequence.create.mockResolvedValue(created)

      const res = await POST(makeRequest('/api/admin/drips', 'POST', validBody))
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.sequence).toEqual(created)
      expect(mockPrisma.dripSequence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Welcome Drip',
            trigger: 'NEW_SUBSCRIBER',
          }),
        })
      )
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await POST(makeRequest('/api/admin/drips', 'POST', validBody))

      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid body (missing steps)', async () => {
      const res = await POST(
        makeRequest('/api/admin/drips', 'POST', {
          name: 'Test',
          trigger: 'NEW_SUBSCRIBER',
          steps: [],
        })
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid trigger', async () => {
      const res = await POST(
        makeRequest('/api/admin/drips', 'POST', {
          name: 'Test',
          trigger: 'INVALID_TRIGGER',
          steps: [{ delayDays: 1, subject: 'Hi', htmlContent: '<p>Hi</p>' }],
        })
      )

      expect(res.status).toBe(400)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.dripSequence.create.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await POST(makeRequest('/api/admin/drips', 'POST', validBody))

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- PATCH /api/admin/drips/[id] ---
  describe('PATCH /api/admin/drips/[id]', () => {
    it('updates a drip sequence', async () => {
      mockPrisma.dripSequence.findUnique.mockResolvedValue({ id: 's1' })
      mockPrisma.dripSequence.update.mockResolvedValue({
        id: 's1',
        name: 'Updated',
        active: false,
      })

      const res = await PATCH(
        makeRequest('/api/admin/drips/s1', 'PATCH', {
          name: 'Updated',
          active: false,
        }),
        makeParams('s1')
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.sequence.name).toBe('Updated')
    })

    it('returns 404 when not found', async () => {
      mockPrisma.dripSequence.findUnique.mockResolvedValue(null)

      const res = await PATCH(
        makeRequest('/api/admin/drips/bad', 'PATCH', { name: 'X' }),
        makeParams('bad')
      )

      expect(res.status).toBe(404)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await PATCH(
        makeRequest('/api/admin/drips/s1', 'PATCH', { name: 'X' }),
        makeParams('s1')
      )

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.dripSequence.findUnique.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await PATCH(
        makeRequest('/api/admin/drips/s1', 'PATCH', { name: 'X' }),
        makeParams('s1')
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- GET /api/admin/drips/[id]/enrollments ---
  describe('GET /api/admin/drips/[id]/enrollments', () => {
    it('returns enrollments for a sequence', async () => {
      const enrollments = [
        { id: 'e1', email: 'a@test.com', status: 'ACTIVE' },
      ]
      mockPrisma.dripEnrollment.findMany.mockResolvedValue(enrollments)

      const res = await getEnrollments(
        makeRequest('/api/admin/drips/s1/enrollments', 'GET'),
        makeParams('s1')
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.enrollments).toEqual(enrollments)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await getEnrollments(
        makeRequest('/api/admin/drips/s1/enrollments', 'GET'),
        makeParams('s1')
      )

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.dripEnrollment.findMany.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await getEnrollments(
        makeRequest('/api/admin/drips/s1/enrollments', 'GET'),
        makeParams('s1')
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })
})
