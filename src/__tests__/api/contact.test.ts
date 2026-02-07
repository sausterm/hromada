/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/contact/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactSubmission: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
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
    contact: { limit: 5, windowSeconds: 60 },
  },
}))

// Mock email
jest.mock('@/lib/email', () => ({
  sendContactNotification: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all contact submissions when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const mockSubmissions = [
      { id: '1', donorName: 'John Doe', message: 'I want to help' },
      { id: '2', donorName: 'Jane Doe', message: 'Count me in' },
    ]
    ;(mockPrisma.contactSubmission.findMany as jest.Mock).mockResolvedValue(mockSubmissions)

    const request = new NextRequest('http://localhost/api/contact')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submissions).toEqual(mockSubmissions)
  })

  it('filters by unhandled only when parameter is set', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.contactSubmission.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/contact?unhandledOnly=true')
    await GET(request)

    expect(mockPrisma.contactSubmission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { handled: false },
      })
    )
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/contact')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.contactSubmission.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/contact')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch contact submissions')
  })
})

describe('POST /api/contact', () => {
  const validContact = {
    projectId: 'project-1',
    donorName: 'John Doe',
    donorEmail: 'john@example.com',
    message: 'I would like to help with this project.',
  }

  const mockProject = {
    id: 'project-1',
    facilityName: 'Central Hospital',
    municipalityName: 'Kyiv',
    contactEmail: 'hospital@kyiv.gov.ua',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
  })

  it('creates contact submission with valid data', async () => {
    const createdSubmission = { id: '1', ...validContact }
    ;(mockPrisma.contactSubmission.create as jest.Mock).mockResolvedValue(createdSubmission)

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validContact),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.submission).toEqual(createdSubmission)
    expect(data.municipalityEmail).toBe('hospital@kyiv.gov.ua')
  })

  it('returns 400 when projectId is missing', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContact, projectId: undefined }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID is required')
  })

  it('returns 400 when donorName is missing', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContact, donorName: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Name is required')
  })

  it('returns 400 when donorEmail is missing', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContact, donorEmail: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('returns 400 when message is missing', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContact, message: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message is required')
  })

  it('returns 400 for invalid email format', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validContact, donorEmail: 'not-an-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 400 when message exceeds 1000 characters', async () => {
    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validContact,
        message: 'a'.repeat(1001),
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message must be 1000 characters or less')
  })

  it('returns 404 when project not found', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validContact),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validContact),
    })

    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('lowercases email and trims name', async () => {
    ;(mockPrisma.contactSubmission.create as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validContact,
        donorEmail: 'John@Example.COM',
        donorName: '  John Doe  ',
      }),
    })

    await POST(request)

    expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        donorEmail: 'john@example.com',
        donorName: 'John Doe',
      }),
    })
  })

  it('returns 500 on database error', async () => {
    ;(mockPrisma.contactSubmission.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validContact),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit contact form')
  })

  it('ignores extra fields not in schema', async () => {
    ;(mockPrisma.contactSubmission.create as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validContact,
        extraField: 'should be ignored',
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    // Only the valid fields should be saved
    expect(mockPrisma.contactSubmission.create).toHaveBeenCalledWith({
      data: {
        projectId: validContact.projectId,
        donorName: validContact.donorName,
        donorEmail: validContact.donorEmail,
        message: validContact.message,
      },
    })
  })
})
