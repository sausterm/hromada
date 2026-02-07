/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/partner/projects/[id]/route'

// Mock auth
const mockSession = {
  userId: 'partner-user-1',
  email: 'partner@example.com',
  role: 'PARTNER' as const,
}

jest.mock('@/lib/auth', () => ({
  verifyPartnerAuth: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectSubmission: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { verifyPartnerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/partner/projects/[id]', () => {
  const mockSubmission = {
    id: 'sub-1',
    municipalityName: 'Test City',
    municipalityEmail: 'city@example.com',
    facilityName: 'Test Hospital',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Brief description',
    fullDescription: 'Full description',
    status: 'PENDING',
    submittedByUserId: 'partner-user-1',
    createdAt: new Date('2026-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/partner/projects/sub-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'sub-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when session has no userId', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ role: 'PARTNER' })

    const request = new NextRequest('http://localhost/api/partner/projects/sub-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'sub-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns submission for authenticated partner', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/partner/projects/sub-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'sub-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submission.id).toBe('sub-1')
    expect(data.submission.municipalityName).toBe('Test City')
    expect(data.submission.facilityName).toBe('Test Hospital')
  })

  it('returns 404 when submission is not found', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/partner/projects/nonexistent')
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Submission not found')
  })

  it('only returns submissions belonging to the authenticated user', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/partner/projects/sub-1')
    await GET(request, { params: Promise.resolve({ id: 'sub-1' }) })

    expect(prisma.projectSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'sub-1',
        submittedByUserId: 'partner-user-1',
      },
    })
  })

  it('returns 500 on database error', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.findFirst as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/partner/projects/sub-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'sub-1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch submission')
  })
})

describe('PATCH /api/partner/projects/[id]', () => {
  const pendingSubmission = {
    id: 'sub-1',
    municipalityName: 'Test City',
    municipalityEmail: 'city@example.com',
    facilityName: 'Test Hospital',
    category: 'HOSPITAL',
    status: 'PENDING',
    submittedByUserId: 'partner-user-1',
  }

  const approvedSubmission = {
    ...pendingSubmission,
    status: 'APPROVED',
  }

  const rejectedSubmission = {
    ...pendingSubmission,
    status: 'REJECTED',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authorization', () => {
    it('returns 401 when not authenticated', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when session has no userId', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ role: 'PARTNER' })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 404 when submission does not exist', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/partner/projects/nonexistent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Submission not found')
    })
  })

  describe('Status restrictions', () => {
    it('returns 400 when trying to edit APPROVED submission', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(approvedSubmission)

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only pending submissions can be edited')
    })

    it('returns 400 when trying to edit REJECTED submission', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(rejectedSubmission)

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only pending submissions can be edited')
    })

    it('allows editing PENDING submission', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(pendingSubmission)
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        facilityName: 'Updated Hospital',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.submission.facilityName).toBe('Updated Hospital')
    })
  })

  describe('Field updates', () => {
    beforeEach(() => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(pendingSubmission)
    })

    it('updates municipalityName', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        municipalityName: 'New City',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipalityName: 'New City' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(response.status).toBe(200)
      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1' },
          data: expect.objectContaining({ municipalityName: 'New City' }),
        })
      )
    })

    it('updates region', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        region: 'Kyiv Oblast',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: 'Kyiv Oblast' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ region: 'Kyiv Oblast' }),
        })
      )
    })

    it('truncates briefDescription to 150 characters', async () => {
      const longDescription = 'a'.repeat(200)
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        briefDescription: 'a'.repeat(150),
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ briefDescription: longDescription }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ briefDescription: 'a'.repeat(150) }),
        })
      )
    })

    it('truncates fullDescription to 2000 characters', async () => {
      const longDescription = 'b'.repeat(2500)
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        fullDescription: 'b'.repeat(2000),
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullDescription: longDescription }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ fullDescription: 'b'.repeat(2000) }),
        })
      )
    })

    it('truncates additionalNotes to 1000 characters', async () => {
      const longNotes = 'c'.repeat(1500)
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        additionalNotes: 'c'.repeat(1000),
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalNotes: longNotes }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ additionalNotes: 'c'.repeat(1000) }),
        })
      )
    })

    it('sets additionalNotes to null when empty', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        additionalNotes: null,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalNotes: '' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ additionalNotes: null }),
        })
      )
    })

    it('parses estimatedCostUsd as float', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        estimatedCostUsd: 50000.50,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedCostUsd: '50000.50' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estimatedCostUsd: 50000.50 }),
        })
      )
    })

    it('sets estimatedCostUsd to null when empty', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        estimatedCostUsd: null,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedCostUsd: '' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estimatedCostUsd: null }),
        })
      )
    })

    it('parses technicalPowerKw as float', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        technicalPowerKw: 100.5,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicalPowerKw: '100.5' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ technicalPowerKw: 100.5 }),
        })
      )
    })

    it('parses numberOfPanels as integer', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        numberOfPanels: 50,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfPanels: '50' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numberOfPanels: 50 }),
        })
      )
    })

    it('sets numberOfPanels to null when empty', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        numberOfPanels: null,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberOfPanels: '' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numberOfPanels: null }),
        })
      )
    })

    it('parses cityLatitude as float', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        cityLatitude: 50.4501,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityLatitude: '50.4501' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cityLatitude: 50.4501 }),
        })
      )
    })

    it('parses cityLongitude as float', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        cityLongitude: 30.5234,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityLongitude: '30.5234' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cityLongitude: 30.5234 }),
        })
      )
    })

    it('lowercases municipalityEmail', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        municipalityEmail: 'test@example.com',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipalityEmail: 'Test@Example.COM' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ municipalityEmail: 'test@example.com' }),
        })
      )
    })

    it('lowercases contactEmail', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        contactEmail: 'contact@example.com',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactEmail: 'CONTACT@Example.COM' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ contactEmail: 'contact@example.com' }),
        })
      )
    })

    it('updates category', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        category: 'SCHOOL',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'SCHOOL' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: 'SCHOOL' }),
        })
      )
    })

    it('updates projectType', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        projectType: 'HEAT_PUMP',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType: 'HEAT_PUMP' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ projectType: 'HEAT_PUMP' }),
        })
      )
    })

    it('updates urgency', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        urgency: 'CRITICAL',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgency: 'CRITICAL' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ urgency: 'CRITICAL' }),
        })
      )
    })

    it('updates cofinancingAvailable', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        cofinancingAvailable: 'YES',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cofinancingAvailable: 'YES' }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cofinancingAvailable: 'YES' }),
        })
      )
    })

    it('updates photos array', async () => {
      const photos = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        photos,
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ photos }),
        })
      )
    })

    it('updates multiple fields at once', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue({
        ...pendingSubmission,
        facilityName: 'New Hospital',
        municipalityName: 'New City',
        category: 'SCHOOL',
      })

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityName: 'New Hospital',
          municipalityName: 'New City',
          category: 'SCHOOL',
        }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            facilityName: 'New Hospital',
            municipalityName: 'New City',
            category: 'SCHOOL',
          }),
        })
      )
    })

    it('ignores non-allowed fields', async () => {
      ;(prisma.projectSubmission.update as jest.Mock).mockResolvedValue(pendingSubmission)

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          submittedByUserId: 'hacker-id',
          approvedProjectId: 'fake-project',
          rejectionReason: 'fake reason',
        }),
      })

      await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })

      expect(prisma.projectSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({
            status: expect.anything(),
            submittedByUserId: expect.anything(),
            approvedProjectId: expect.anything(),
            rejectionReason: expect.anything(),
          }),
        })
      )
    })
  })

  describe('Error handling', () => {
    it('returns 500 on database error', async () => {
      ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(pendingSubmission)
      ;(prisma.projectSubmission.update as jest.Mock).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/partner/projects/sub-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facilityName: 'Updated Hospital' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'sub-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update submission')
    })
  })
})
