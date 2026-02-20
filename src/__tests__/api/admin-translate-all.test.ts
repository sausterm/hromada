/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock translate
jest.mock('@/lib/translate', () => ({
  translateProjectToUkrainian: jest.fn(),
}))

import { POST } from '@/app/api/admin/translate-all/route'
import { verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>

describe('POST /api/admin/translate-all', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, DEEPL_API_KEY: 'test-key' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns 401 when not authorized', async () => {
    mockVerifyAdminAuth.mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/translate-all', {
      method: 'POST',
    })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('returns 500 when DEEPL_API_KEY is not set', async () => {
    mockVerifyAdminAuth.mockResolvedValue(true)
    delete process.env.DEEPL_API_KEY

    const request = new NextRequest('http://localhost/api/admin/translate-all', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('DEEPL_API_KEY')
  })

  it('returns message when all projects already translated', async () => {
    mockVerifyAdminAuth.mockResolvedValue(true)
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/admin/translate-all', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.translated).toBe(0)
    expect(data.message).toContain('already translated')
  })

  it('queues translation for untranslated projects', async () => {
    mockVerifyAdminAuth.mockResolvedValue(true)
    const mockProjects = [
      { id: 'p1', municipalityName: 'Kyiv', facilityName: 'School #1', briefDescription: 'Desc', fullDescription: 'Full' },
      { id: 'p2', municipalityName: 'Lviv', facilityName: 'Hospital', briefDescription: 'Desc', fullDescription: 'Full' },
    ]
    ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

    const request = new NextRequest('http://localhost/api/admin/translate-all', {
      method: 'POST',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.queued).toBe(2)
    expect(data.message).toContain('Translating 2 projects')
  })
})
