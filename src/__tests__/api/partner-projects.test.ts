/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/partner/projects/route'

// Mock auth
const mockSession = {
  userId: 'partner-user-1',
  email: 'partner@example.com',
  role: 'PARTNER' as const,
}

jest.mock('@/lib/auth', () => ({
  verifyPartnerAuth: jest.fn(),
  getSessionData: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectSubmission: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { verifyPartnerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/partner/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/partner/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when session has no userId', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ role: 'PARTNER' })

    const request = new NextRequest('http://localhost/api/partner/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns submissions for authenticated partner', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const mockSubmissions = [
      {
        id: 'sub-1',
        municipalityName: 'Test City',
        facilityName: 'Test Hospital',
        status: 'PENDING',
        createdAt: new Date('2026-01-01'),
      },
    ]
    ;(prisma.projectSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions)

    const request = new NextRequest('http://localhost/api/partner/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submissions).toHaveLength(1)
    expect(data.submissions[0].id).toBe('sub-1')
    expect(data.submissions[0].municipalityName).toBe('Test City')
    expect(prisma.projectSubmission.findMany).toHaveBeenCalledWith({
      where: { submittedByUserId: 'partner-user-1' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('returns 500 on database error', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/partner/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch submissions')
  })
})

describe('POST /api/partner/projects', () => {
  const validSubmission = {
    municipalityName: 'Test City',
    municipalityEmail: 'city@example.com',
    facilityName: 'Test Hospital',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Brief description',
    fullDescription: 'Full description of the project',
    cityName: 'Kyiv',
    cityLatitude: '50.4501',
    cityLongitude: '30.5234',
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when required fields are missing', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipalityName: 'Test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('is required')
  })

  it('returns 400 for invalid email format', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        municipalityEmail: 'invalid-email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('email')
  })

  it('returns 400 for invalid category', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        category: 'INVALID_CATEGORY',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid category')
  })

  it('returns 400 for invalid coordinates', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        cityLatitude: '999',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid city latitude')
  })

  it('creates submission successfully', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)

    const createdSubmission = {
      id: 'new-sub-1',
      ...validSubmission,
      status: 'PENDING',
      createdAt: new Date(),
    }
    ;(prisma.projectSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.submission).toBeDefined()
    expect(prisma.projectSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        municipalityName: 'Test City',
        submittedByUserId: 'partner-user-1',
      }),
    })
  })

  it('defaults urgency to MEDIUM when not provided', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.projectSubmission.create as jest.Mock).mockResolvedValue({ id: 'new-sub' })

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    await POST(request)

    expect(prisma.projectSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        urgency: 'MEDIUM',
      }),
    })
  })
})
