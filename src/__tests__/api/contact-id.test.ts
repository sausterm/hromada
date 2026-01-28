/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/contact/[id]/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    contactSubmission: {
      update: jest.fn(),
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

describe('PATCH /api/contact/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('successfully marks contact submission as handled', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const mockSubmission = {
      id: '1',
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      message: 'I want to help',
      handled: true,
      project: {
        id: 'project-1',
        facilityName: 'Test Hospital',
        municipalityName: 'Kyiv',
      },
    }
    ;(mockPrisma.contactSubmission.update as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: true }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submission).toEqual(mockSubmission)
    expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { handled: true },
      include: {
        project: {
          select: {
            id: true,
            facilityName: true,
            municipalityName: true,
          },
        },
      },
    })
  })

  it('successfully marks contact submission as unhandled', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const mockSubmission = {
      id: '1',
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      message: 'I want to help',
      handled: false,
      project: {
        id: 'project-1',
        facilityName: 'Test Hospital',
        municipalityName: 'Kyiv',
      },
    }
    ;(mockPrisma.contactSubmission.update as jest.Mock).mockResolvedValue(mockSubmission)

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: false }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.submission).toEqual(mockSubmission)
    expect(data.submission.handled).toBe(false)
    expect(mockPrisma.contactSubmission.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { handled: false },
      include: {
        project: {
          select: {
            id: true,
            facilityName: true,
            municipalityName: true,
          },
        },
      },
    })
  })

  it('returns 401 when not authorized', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: true }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(mockPrisma.contactSubmission.update).not.toHaveBeenCalled()
  })

  it('returns 400 when handled field is not a boolean', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: 'yes' }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request: handled must be a boolean')
    expect(mockPrisma.contactSubmission.update).not.toHaveBeenCalled()
  })

  it('returns 400 when handled field is missing', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request: handled must be a boolean')
    expect(mockPrisma.contactSubmission.update).not.toHaveBeenCalled()
  })

  it('returns 404 when contact submission not found', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    const notFoundError = new Error('Record to update not found.')
    ;(notFoundError as any).code = 'P2025'
    ;(mockPrisma.contactSubmission.update as jest.Mock).mockRejectedValue(notFoundError)

    const request = new NextRequest('http://localhost/api/contact/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: true }),
    })

    const response = await PATCH(request, createParams('nonexistent'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Contact submission not found')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(mockPrisma.contactSubmission.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/contact/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handled: true }),
    })

    const response = await PATCH(request, createParams('1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update contact submission')
  })
})
