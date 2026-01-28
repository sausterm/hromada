/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/inquiries/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    inquiry: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/inquiries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HROMADA_ADMIN_SECRET = 'test-secret'
  })

  it('returns all inquiries for authenticated admin', async () => {
    const mockInquiries = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ]
    ;(mockPrisma.inquiry.findMany as jest.Mock).mockResolvedValue(mockInquiries)

    const request = new NextRequest('http://localhost/api/inquiries', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.inquiries).toEqual(mockInquiries)
  })

  it('rejects unauthenticated requests', async () => {
    const request = new NextRequest('http://localhost/api/inquiries')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('filters by projectId', async () => {
    ;(mockPrisma.inquiry.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/inquiries?projectId=proj-123', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    await GET(request)

    expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: 'proj-123' },
      })
    )
  })

  it('filters unread only', async () => {
    ;(mockPrisma.inquiry.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/inquiries?unreadOnly=true', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    await GET(request)

    expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { read: false },
      })
    )
  })

  it('handles database errors', async () => {
    ;(mockPrisma.inquiry.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/inquiries', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch inquiries')
  })
})

describe('POST /api/inquiries', () => {
  const validInquiry = {
    projectId: 'proj-123',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'I want to help with this project.',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates inquiry with valid data', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'proj-123' })
    ;(mockPrisma.inquiry.create as jest.Mock).mockResolvedValue({ id: 'inq-1', ...validInquiry })

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.inquiry).toBeDefined()
  })

  it('rejects request without projectId', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, projectId: undefined }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Project ID is required')
  })

  it('rejects request without name', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, name: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Name is required')
  })

  it('rejects request without email', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, email: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('rejects request without message', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, message: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message is required')
  })

  it('rejects invalid email format', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, email: 'invalid-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 404 if project not found', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('handles database errors', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'proj-123' })
    ;(mockPrisma.inquiry.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit inquiry')
  })

  it('lowercases email', async () => {
    const projectId = 'proj-123'
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({ id: projectId })
    ;(mockPrisma.inquiry.create as jest.Mock).mockResolvedValue({ id: 'inq-1' })

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        message: 'Test message',
      }),
    })

    await POST(request)

    expect(mockPrisma.inquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'john@example.com',
      }),
    })
  })

  it('handles optional organization field', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'proj-123' })
    ;(mockPrisma.inquiry.create as jest.Mock).mockResolvedValue({ id: 'inq-1' })

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validInquiry, organization: 'Test Org' }),
    })

    await POST(request)

    expect(mockPrisma.inquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organization: 'Test Org',
      }),
    })
  })
})
