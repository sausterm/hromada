/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/submissions/route'
import {
  GET as getSubmission,
  PATCH,
  DELETE,
} from '@/app/api/projects/submissions/[id]/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectSubmission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      create: jest.fn(),
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
  RATE_LIMITS: {
    projectSubmission: { limit: 3, windowSeconds: 3600 },
  },
}))

// Mock AWS SES
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
}))

import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

// Helper to create params
const createParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/projects/submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all submissions when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const mockSubmissions = [
      { id: '1', facilityName: 'Test Project', status: 'PENDING' },
      { id: '2', facilityName: 'Another Project', status: 'APPROVED' },
    ]
    ;(mockPrisma.projectSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions)

    const request = new NextRequest('http://localhost/api/projects/submissions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submissions).toEqual(mockSubmissions)
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/projects/submissions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch submissions')
  })
})

describe('POST /api/projects/submissions', () => {
  const validSubmission = {
    municipalityName: 'Kyiv Municipality',
    municipalityEmail: 'municipality@kyiv.gov.ua',
    facilityName: 'Central Hospital',
    category: 'HOSPITAL',
    projectType: 'SOLAR',
    briefDescription: 'Solar panels for hospital',
    fullDescription: 'We need solar panels for our central hospital to ensure uninterrupted power supply.',
    cityName: 'Kyiv',
    cityLatitude: '50.4501',
    cityLongitude: '30.5234',
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_SES_REGION = 'us-east-1'
    process.env.ADMIN_EMAIL = 'admin@test.com'
  })

  it('creates submission with valid data', async () => {
    const createdSubmission = { id: '1', ...validSubmission }
    ;(mockPrisma.projectSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.submissionId).toBe('1')
  })

  it('returns 400 when required field is missing', async () => {
    const incompleteSubmission = { ...validSubmission }
    delete (incompleteSubmission as any).facilityName

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('expected string')
  })

  it('returns 400 for invalid municipality email format', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        municipalityEmail: 'not-an-email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 400 for invalid contact email format', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        contactEmail: 'invalid-contact-email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 400 for briefDescription over 150 characters', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        briefDescription: 'a'.repeat(151),
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Brief description must be 150 characters or less')
  })

  it('returns 400 for fullDescription over 2000 characters', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        fullDescription: 'a'.repeat(2001),
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Full description must be 2000 characters or less')
  })

  it('returns 400 for invalid latitude', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        cityLatitude: '100', // Invalid - out of range
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid latitude')
  })

  it('returns 400 for invalid longitude', async () => {
    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validSubmission,
        cityLongitude: '200', // Invalid - out of range
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid longitude')
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    ;(mockPrisma.projectSubmission.create as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit project')
  })

  it('handles optional fields in email template', async () => {
    const submissionWithOptionalFields = {
      ...validSubmission,
      region: 'Kyiv Oblast',
      contactPhone: '+380123456789',
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    }
    const createdSubmission = { id: '1', ...submissionWithOptionalFields }
    ;(mockPrisma.projectSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionWithOptionalFields),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles missing email configuration gracefully', async () => {
    delete process.env.AWS_SES_REGION
    delete process.env.ADMIN_EMAIL

    const createdSubmission = { id: '1', ...validSubmission }
    ;(mockPrisma.projectSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('handles submission without photos', async () => {
    const submissionNoPhotos = {
      ...validSubmission,
      photos: undefined,
    }
    const createdSubmission = { id: '1', ...submissionNoPhotos }
    ;(mockPrisma.projectSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionNoPhotos),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('rejects more than 5 photos', async () => {
    const submissionManyPhotos = {
      ...validSubmission,
      photos: [
        'https://example.com/1.jpg', 'https://example.com/2.jpg',
        'https://example.com/3.jpg', 'https://example.com/4.jpg',
        'https://example.com/5.jpg', 'https://example.com/6.jpg',
      ],
    }

    const request = new NextRequest('http://localhost/api/projects/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionManyPhotos),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})

describe('GET /api/projects/submissions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns submission when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const mockSubmission = { id: '1', facilityName: 'Test Project', status: 'PENDING' }
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions/1')
    const response = await getSubmission(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submission).toEqual(mockSubmission)
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions/1')
    const response = await getSubmission(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when submission not found', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/submissions/nonexistent')
    const response = await getSubmission(request, createParams('nonexistent'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Submission not found')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/projects/submissions/1')
    const response = await getSubmission(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch submission')
  })
})

describe('PATCH /api/projects/submissions/[id]', () => {
  const mockSubmission = {
    id: '1',
    facilityName: 'Test Project',
    municipalityName: 'Kyiv',
    category: 'HOSPITAL',
    briefDescription: 'Test brief',
    fullDescription: 'Test full description',
    cityLatitude: 50.4501,
    cityLongitude: 30.5234,
    contactName: 'John Doe',
    contactEmail: 'john@test.com',
    contactPhone: null,
    urgency: 'MEDIUM',
    address: null,
    projectType: 'SOLAR',
    projectSubtype: null,
    technicalPowerKw: null,
    numberOfPanels: null,
    estimatedCostUsd: null,
    cofinancingAvailable: null,
    cofinancingDetails: null,
    partnerOrganization: null,
    status: 'PENDING',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.AWS_SES_REGION = 'us-east-1'
  })

  it('approves submission and creates project', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)
    ;(mockPrisma.project.create as jest.Mock).mockResolvedValue({ id: 'project-1' })
    ;(mockPrisma.projectSubmission.update as jest.Mock).mockResolvedValue({
      ...mockSubmission,
      status: 'APPROVED',
    })

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.projectId).toBe('project-1')
    expect(mockPrisma.project.create).toHaveBeenCalled()
  })

  it('rejects submission with reason', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)
    ;(mockPrisma.projectSubmission.update as jest.Mock).mockResolvedValue({
      ...mockSubmission,
      status: 'REJECTED',
    })

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        rejectionReason: 'Incomplete documentation',
      }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Submission rejected')
  })

  it('returns 400 when rejection reason is missing', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Rejection reason is required')
  })

  it('returns 400 for already processed submission', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue({
      ...mockSubmission,
      status: 'APPROVED',
    })

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Submission has already been processed')
  })

  it('returns 400 for invalid action', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid action')
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when submission not found', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/submissions/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await PATCH(request, createParams('nonexistent'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Submission not found')
  })

  it('returns 500 on database error during approval', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.findUnique as jest.Mock).mockResolvedValue(mockSubmission)
    ;(mockPrisma.project.create as jest.Mock).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process submission')
  })
})

describe('DELETE /api/projects/submissions/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deletes submission when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.delete as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.projectSubmission.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.projectSubmission.delete as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects/submissions/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete submission')
  })
})
