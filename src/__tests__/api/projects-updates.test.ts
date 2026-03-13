/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/projects/[id]/updates/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    projectSubmission: {
      findFirst: jest.fn(),
    },
    projectUpdate: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAuth: jest.fn(),
}))

// Mock notify-donors
jest.mock('@/lib/notify-donors', () => ({
  notifyDonors: jest.fn().mockResolvedValue(undefined),
}))

import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { notifyDonors } from '@/lib/notify-donors'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const createParams = (id: string) => ({ params: Promise.resolve({ id }) })

const validBody = {
  title: 'Construction Started',
  message: 'Work has begun on the heat pump installation.',
  type: 'MANUAL',
}

describe('POST /api/projects/[id]/updates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no userId', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: null, role: 'ADMIN' })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(401)
  })

  it('returns 403 for disallowed roles', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'u1', role: 'DONOR' })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Forbidden')
  })

  it('returns 404 when project not found', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'u1', role: 'ADMIN' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(404)
  })

  it('returns 403 when partner does not own the project', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'partner-1', role: 'PARTNER' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Test Project',
    })
    ;(mockPrisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('You do not have access to this project')
  })

  it('returns 400 for invalid body (missing title)', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'u1', role: 'ADMIN' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Test',
    })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'No title', type: 'MANUAL' }),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Validation failed')
  })

  it('returns 400 for invalid type enum', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'u1', role: 'ADMIN' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Test',
    })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'T', message: 'M', type: 'INVALID' }),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(400)
  })

  it('creates update successfully as ADMIN', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Horenka Hospital',
    })
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: 'Admin User',
      organization: null,
      role: 'ADMIN',
    })

    const mockUpdate = { id: 'upd-1', ...validBody, projectId: 'proj-1' }
    ;(mockPrisma.projectUpdate.create as jest.Mock).mockResolvedValue(mockUpdate)

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.update.id).toBe('upd-1')
    expect(mockPrisma.projectUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: 'proj-1',
          title: validBody.title,
          message: validBody.message,
          type: 'MANUAL',
          createdByRole: 'Admin',
        }),
      })
    )
    expect(notifyDonors).toHaveBeenCalledWith('proj-1', 'Horenka Hospital', {
      title: validBody.title,
      message: validBody.message,
    })
  })

  it('creates update as PARTNER with organization name', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'partner-1', role: 'PARTNER' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Test',
    })
    ;(mockPrisma.projectSubmission.findFirst as jest.Mock).mockResolvedValue({
      id: 'sub-1',
    })
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: 'Partner User',
      organization: 'NGO Ecoaction',
      role: 'PARTNER',
    })
    ;(mockPrisma.projectUpdate.create as jest.Mock).mockResolvedValue({ id: 'upd-2' })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(201)

    expect(mockPrisma.projectUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdByName: 'NGO Ecoaction',
          createdByRole: 'Partner',
        }),
      })
    )
  })

  it('handles photoUrl in body', async () => {
    ;(verifyAuth as jest.Mock).mockResolvedValue({ userId: 'admin-1', role: 'ADMIN' })
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      id: 'proj-1',
      facilityName: 'Test',
    })
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      name: 'Admin',
      organization: null,
      role: 'ADMIN',
    })
    ;(mockPrisma.projectUpdate.create as jest.Mock).mockResolvedValue({ id: 'upd-3' })

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validBody,
        type: 'PHOTO_ADDED',
        photoUrl: 'https://example.com/photo.jpg',
      }),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(201)

    expect(mockPrisma.projectUpdate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: {
            photoUrl: 'https://example.com/photo.jpg',
            photoUrls: ['https://example.com/photo.jpg'],
          },
        }),
      })
    )
  })

  it('returns 500 on unexpected error', async () => {
    ;(verifyAuth as jest.Mock).mockRejectedValue(new Error('Unexpected'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const request = new NextRequest('http://localhost/api/projects/proj-1/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })

    const response = await POST(request, createParams('proj-1'))
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to create update')

    consoleSpy.mockRestore()
  })
})
