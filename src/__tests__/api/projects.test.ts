/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns all projects', async () => {
    const mockProjects = [
      { id: '1', facilityName: 'Hospital A', category: 'HOSPITAL' },
      { id: '2', facilityName: 'School B', category: 'SCHOOL' },
    ]
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

    const request = new NextRequest('http://localhost/api/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects).toEqual(mockProjects)
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by category', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?category=HOSPITAL')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { category: 'HOSPITAL' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by status', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?status=OPEN')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by urgency', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?urgency=HIGH')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { urgency: 'HIGH' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('combines multiple filters', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?category=HOSPITAL&status=OPEN&urgency=HIGH')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { category: 'HOSPITAL', status: 'OPEN', urgency: 'HIGH' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('handles database errors', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch projects')
  })
})

describe('POST /api/projects', () => {
  const validProject = {
    municipalityName: 'Kyiv',
    facilityName: 'Test Hospital',
    category: 'HOSPITAL',
    description: 'A hospital needing support',
    address: '123 Main St, Kyiv',
    latitude: 50.4501,
    longitude: 30.5234,
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HROMADA_ADMIN_SECRET = 'test-secret'
  })

  it('creates project with valid auth and data', async () => {
    const createdProject = { id: '1', ...validProject }
    ;(mockPrisma.project.create as jest.Mock).mockResolvedValue(createdProject)

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify(validProject),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.project).toEqual(createdProject)
  })

  it('rejects request without auth header', async () => {
    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProject),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('rejects request with wrong auth token', async () => {
    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong-secret',
      },
      body: JSON.stringify(validProject),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('rejects request with missing required field', async () => {
    const incompleteProject = { ...validProject }
    delete (incompleteProject as any).facilityName

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify(incompleteProject),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required field: facilityName')
  })

  it('handles database errors', async () => {
    ;(mockPrisma.project.create as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify(validProject),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create project')
  })

  it('sets default values for optional fields', async () => {
    ;(mockPrisma.project.create as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify(validProject),
    })

    await POST(request)

    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        urgency: 'MEDIUM',
        status: 'OPEN',
        contactPhone: null,
        photos: [],
      }),
    })
  })
})
