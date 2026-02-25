/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailCampaign: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

// Mock campaign-sender
const mockSendCampaign = jest.fn()
jest.mock('@/lib/campaign-sender', () => ({
  sendCampaign: (...args: unknown[]) => mockSendCampaign(...args),
}))

import { GET, POST } from '@/app/api/admin/campaigns/route'
import {
  GET as getCampaign,
  PATCH,
} from '@/app/api/admin/campaigns/[id]/route'
import { POST as sendCampaignRoute } from '@/app/api/admin/campaigns/[id]/send/route'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

const mockPrisma = prisma as unknown as {
  emailCampaign: {
    findMany: jest.Mock
    findUnique: jest.Mock
    create: jest.Mock
    update: jest.Mock
  }
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

describe('admin campaigns routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyAdmin.mockResolvedValue(true)
  })

  // --- GET /api/admin/campaigns ---
  describe('GET /api/admin/campaigns', () => {
    it('returns list of campaigns', async () => {
      const campaigns = [
        { id: 'c1', subject: 'Campaign 1', status: 'DRAFT' },
      ]
      mockPrisma.emailCampaign.findMany.mockResolvedValue(campaigns)

      const res = await GET(makeRequest('/api/admin/campaigns', 'GET'))
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.campaigns).toEqual(campaigns)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await GET(makeRequest('/api/admin/campaigns', 'GET'))

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.emailCampaign.findMany.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await GET(makeRequest('/api/admin/campaigns', 'GET'))

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- POST /api/admin/campaigns ---
  describe('POST /api/admin/campaigns', () => {
    it('creates a draft campaign', async () => {
      const campaign = { id: 'c1', subject: 'New', status: 'DRAFT' }
      mockPrisma.emailCampaign.create.mockResolvedValue(campaign)

      const res = await POST(
        makeRequest('/api/admin/campaigns', 'POST', {
          subject: 'New',
          htmlContent: '<p>Hello</p>',
        })
      )
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.campaign).toEqual(campaign)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await POST(
        makeRequest('/api/admin/campaigns', 'POST', {
          subject: 'Test',
          htmlContent: '<p>Test</p>',
        })
      )

      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid body', async () => {
      const res = await POST(
        makeRequest('/api/admin/campaigns', 'POST', { subject: '' })
      )

      expect(res.status).toBe(400)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.emailCampaign.create.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await POST(
        makeRequest('/api/admin/campaigns', 'POST', {
          subject: 'Test',
          htmlContent: '<p>Test</p>',
        })
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- GET /api/admin/campaigns/[id] ---
  describe('GET /api/admin/campaigns/[id]', () => {
    it('returns campaign detail', async () => {
      const campaign = { id: 'c1', subject: 'Test', sends: [] }
      mockPrisma.emailCampaign.findUnique.mockResolvedValue(campaign)

      const res = await getCampaign(
        makeRequest('/api/admin/campaigns/c1', 'GET'),
        makeParams('c1')
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.campaign).toEqual(campaign)
    })

    it('returns 404 when not found', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue(null)

      const res = await getCampaign(
        makeRequest('/api/admin/campaigns/bad', 'GET'),
        makeParams('bad')
      )

      expect(res.status).toBe(404)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await getCampaign(
        makeRequest('/api/admin/campaigns/c1', 'GET'),
        makeParams('c1')
      )

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.emailCampaign.findUnique.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await getCampaign(
        makeRequest('/api/admin/campaigns/c1', 'GET'),
        makeParams('c1')
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- PATCH /api/admin/campaigns/[id] ---
  describe('PATCH /api/admin/campaigns/[id]', () => {
    it('updates a draft campaign', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'DRAFT',
      })
      mockPrisma.emailCampaign.update.mockResolvedValue({
        id: 'c1',
        subject: 'Updated',
      })

      const res = await PATCH(
        makeRequest('/api/admin/campaigns/c1', 'PATCH', {
          subject: 'Updated',
        }),
        makeParams('c1')
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.campaign.subject).toBe('Updated')
    })

    it('returns 404 when not found', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue(null)

      const res = await PATCH(
        makeRequest('/api/admin/campaigns/bad', 'PATCH', {
          subject: 'Updated',
        }),
        makeParams('bad')
      )

      expect(res.status).toBe(404)
    })

    it('returns 400 when campaign is not a draft', async () => {
      mockPrisma.emailCampaign.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'COMPLETED',
      })

      const res = await PATCH(
        makeRequest('/api/admin/campaigns/c1', 'PATCH', {
          subject: 'Updated',
        }),
        makeParams('c1')
      )

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Only draft campaigns can be edited')
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await PATCH(
        makeRequest('/api/admin/campaigns/c1', 'PATCH', {
          subject: 'Updated',
        }),
        makeParams('c1')
      )

      expect(res.status).toBe(401)
    })

    it('returns 500 on database error', async () => {
      mockPrisma.emailCampaign.findUnique.mockRejectedValue(new Error('DB'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await PATCH(
        makeRequest('/api/admin/campaigns/c1', 'PATCH', {
          subject: 'Updated',
        }),
        makeParams('c1')
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })

  // --- POST /api/admin/campaigns/[id]/send ---
  describe('POST /api/admin/campaigns/[id]/send', () => {
    it('sends a campaign successfully', async () => {
      mockSendCampaign.mockResolvedValue({ success: true, sent: 10, failed: 0 })

      const res = await sendCampaignRoute(
        makeRequest('/api/admin/campaigns/c1/send', 'POST'),
        makeParams('c1')
      )
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json).toEqual({ success: true, sent: 10, failed: 0 })
    })

    it('returns 400 when sendCampaign fails', async () => {
      mockSendCampaign.mockResolvedValue({
        success: false,
        sent: 0,
        failed: 0,
        error: 'Campaign not found',
      })

      const res = await sendCampaignRoute(
        makeRequest('/api/admin/campaigns/c1/send', 'POST'),
        makeParams('c1')
      )

      expect(res.status).toBe(400)
    })

    it('returns 401 when not admin', async () => {
      mockVerifyAdmin.mockResolvedValue(false)

      const res = await sendCampaignRoute(
        makeRequest('/api/admin/campaigns/c1/send', 'POST'),
        makeParams('c1')
      )

      expect(res.status).toBe(401)
    })

    it('returns 500 on unexpected error', async () => {
      mockSendCampaign.mockRejectedValue(new Error('Crash'))
      const spy = jest.spyOn(console, 'error').mockImplementation()

      const res = await sendCampaignRoute(
        makeRequest('/api/admin/campaigns/c1/send', 'POST'),
        makeParams('c1')
      )

      expect(res.status).toBe(500)
      spy.mockRestore()
    })
  })
})
