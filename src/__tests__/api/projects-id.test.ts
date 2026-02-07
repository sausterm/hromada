/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/projects/[id]/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

// Helper to create params
const createParams = (id: string) => ({ params: Promise.resolve({ id }) })

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns project when found', async () => {
    const mockProject = {
      id: '1',
      facilityName: 'Test Hospital',
      municipalityName: 'Kyiv',
      category: 'HOSPITAL',
      photos: [{ url: 'https://example.com/photo.jpg' }],
    }
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)

    const request = new NextRequest('http://localhost/api/projects/1')
    const response = await GET(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.project.facilityName).toBe('Test Hospital')
    expect(data.project.photos).toEqual(['https://example.com/photo.jpg'])
    expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    })
  })

  it('returns 404 when project not found', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/nonexistent')
    const response = await GET(request, createParams('nonexistent'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Project not found')
  })

  it('returns 500 on database error', async () => {
    ;(mockPrisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects/1')
    const response = await GET(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch project')
  })
})

describe('PUT /api/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HROMADA_ADMIN_SECRET = 'test-secret'
  })

  it('updates project when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const updatedProject = {
      id: '1',
      facilityName: 'Updated Hospital',
      status: 'FUNDED',
    }
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue(updatedProject)

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityName: 'Updated Hospital', status: 'FUNDED' }),
    })

    const response = await PUT(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.project).toEqual(updatedProject)
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityName: 'Updated Hospital' }),
    })

    const response = await PUT(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('only updates provided fields', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FUNDED' }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { status: 'FUNDED' },
    })
  })

  it('parses numeric fields correctly', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityLatitude: '50.4501',
        cityLongitude: '30.5234',
        technicalPowerKw: '100.5',
        numberOfPanels: '20',
        estimatedCostUsd: '50000',
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        cityLatitude: 50.4501,
        cityLongitude: 30.5234,
        technicalPowerKw: 100.5,
        numberOfPanels: 20,
        estimatedCostUsd: 50000,
      },
    })
  })

  it('allows clearing optional fields with null', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '',
        contactPhone: '',
        projectType: '',
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: {
        address: null,
        contactPhone: null,
        projectType: null,
      },
    })
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityName: 'Updated' }),
    })

    const response = await PUT(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update project')
  })

  it('updates all text fields', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipalityName: 'New Municipality',
        category: 'HOSPITAL',
        briefDescription: 'Brief',
        fullDescription: 'Full description',
        contactName: 'Contact Name',
        contactEmail: 'contact@example.com',
        urgency: 'HIGH',
        status: 'IN_DISCUSSION',
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: expect.objectContaining({
        municipalityName: 'New Municipality',
        category: 'HOSPITAL',
        briefDescription: 'Brief',
        fullDescription: 'Full description',
        contactName: 'Contact Name',
        contactEmail: 'contact@example.com',
        urgency: 'HIGH',
        status: 'IN_DISCUSSION',
      }),
    })
  })

  it('updates cofinancing fields', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cofinancingAvailable: 'YES',
        cofinancingDetails: 'Details here',
        partnerOrganization: 'Partner Org',
        projectSubtype: 'Rooftop',
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: expect.objectContaining({
        cofinancingAvailable: 'YES',
        cofinancingDetails: 'Details here',
        partnerOrganization: 'Partner Org',
        projectSubtype: 'Rooftop',
      }),
    })
  })

  it('clears optional numeric fields with zero value', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technicalPowerKw: 0,
        numberOfPanels: 0,
        estimatedCostUsd: 0,
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: expect.objectContaining({
        technicalPowerKw: null,
        numberOfPanels: null,
        estimatedCostUsd: null,
      }),
    })
  })

  it('clears cofinancing fields with empty strings', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.update as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cofinancingAvailable: '',
        cofinancingDetails: '',
        partnerOrganization: '',
        projectSubtype: '',
      }),
    })

    await PUT(request, createParams('1'))

    expect(mockPrisma.project.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: expect.objectContaining({
        cofinancingAvailable: null,
        cofinancingDetails: null,
        partnerOrganization: null,
        projectSubtype: null,
      }),
    })
  })
})

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.HROMADA_ADMIN_SECRET = 'test-secret'
  })

  it('deletes project when authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.delete as jest.Mock).mockResolvedValue({ id: '1' })

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockPrisma.project.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(mockPrisma.project.delete).not.toHaveBeenCalled()
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.project.delete as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/projects/1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete project')
  })
})
