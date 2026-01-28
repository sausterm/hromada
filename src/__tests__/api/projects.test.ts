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
      count: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockPrisma.project.count as jest.Mock).mockResolvedValue(2)
  })

  it('returns paginated projects by default', async () => {
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
    expect(data.pagination).toBeDefined()
    expect(data.pagination.total).toBe(2)
    expect(data.pagination.hasMore).toBe(false)
  })

  it('returns all projects when ?all=true', async () => {
    const mockProjects = [
      { id: '1', facilityName: 'Hospital A', category: 'HOSPITAL' },
      { id: '2', facilityName: 'School B', category: 'SCHOOL' },
    ]
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

    const request = new NextRequest('http://localhost/api/projects?all=true')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects).toEqual(mockProjects)
    expect(data.total).toBe(2)
    expect(data.pagination).toBeUndefined()
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('supports cursor-based pagination', async () => {
    const mockProjects = [
      { id: '3', facilityName: 'School C', category: 'SCHOOL' },
    ]
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

    const request = new NextRequest('http://localhost/api/projects?cursor=2&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: {},
      take: 11, // limit + 1 to check for more
      cursor: { id: '2' },
      skip: 1,
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('indicates hasMore when there are more results', async () => {
    // Return limit + 1 items to indicate more exist
    const mockProjects = [
      { id: '1', facilityName: 'Hospital A' },
      { id: '2', facilityName: 'Hospital B' },
      { id: '3', facilityName: 'Hospital C' }, // Extra item
    ]
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)
    ;(mockPrisma.project.count as jest.Mock).mockResolvedValue(10)

    const request = new NextRequest('http://localhost/api/projects?limit=2')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.projects.length).toBe(2) // Should slice off the extra
    expect(data.pagination.hasMore).toBe(true)
    expect(data.pagination.nextCursor).toBe('2')
  })

  it('respects MAX_PAGE_SIZE limit', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?limit=500')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 101, // MAX_PAGE_SIZE (100) + 1
      })
    )
  })

  it('filters by category', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?category=HOSPITAL&all=true')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { category: 'HOSPITAL' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by status', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?status=OPEN&all=true')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by urgency', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?urgency=HIGH&all=true')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { urgency: 'HIGH' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('filters by projectType', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?projectType=SOLAR&all=true')
    await GET(request)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
      where: { projectType: 'SOLAR' },
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
    })
  })

  it('combines multiple filters', async () => {
    ;(mockPrisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/projects?category=HOSPITAL&status=OPEN&urgency=HIGH&all=true')
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
    briefDescription: 'A hospital needing support',
    fullDescription: 'Full description of the hospital project that needs support from donors.',
    address: '123 Main St, Kyiv',
    cityLatitude: 50.4501,
    cityLongitude: 30.5234,
    contactName: 'John Doe',
    contactEmail: 'john@example.com',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HROMADA_ADMIN_SECRET = 'test-secret'
  })

  it('creates project with valid auth and data', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
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

  it('rejects request when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

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

  it('rejects request with missing required field', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
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

  it('rejects briefDescription over 150 characters', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const longBriefDescription = 'a'.repeat(151)

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify({ ...validProject, briefDescription: longBriefDescription }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('briefDescription must be 150 characters or less')
  })

  it('rejects fullDescription over 2000 characters', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const longFullDescription = 'a'.repeat(2001)

    const request = new NextRequest('http://localhost/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret',
      },
      body: JSON.stringify({ ...validProject, fullDescription: longFullDescription }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('fullDescription must be 2000 characters or less')
  })

  it('handles database errors', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
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
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
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
      }),
    })
  })
})
