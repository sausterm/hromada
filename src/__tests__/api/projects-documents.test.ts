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
    projectDocument: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  },
  isSupabaseConfigured: true,
  STORAGE_BUCKET: 'project-images',
}))

// Mock pdf-extract
jest.mock('@/lib/pdf-extract', () => ({
  extractAndTranslateDocument: jest.fn().mockResolvedValue(undefined),
}))

import { GET, DELETE } from '@/app/api/projects/[id]/documents/route'
import { verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

const mockVerifyAdminAuth = verifyAdminAuth as jest.MockedFunction<typeof verifyAdminAuth>

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('/api/projects/[id]/documents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns documents for a project', async () => {
      const mockDocs = [
        { id: 'd1', projectId: 'p1', filename: 'test.pdf', url: 'http://test.com/test.pdf' },
      ]
      ;(prisma.projectDocument.findMany as jest.Mock).mockResolvedValue(mockDocs)

      const request = new NextRequest('http://localhost/api/projects/p1/documents')
      const response = await GET(request, makeParams('p1'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.documents).toEqual(mockDocs)
      expect(prisma.projectDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'p1' } })
      )
    })

    it('returns empty array when no documents', async () => {
      ;(prisma.projectDocument.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/projects/p1/documents')
      const response = await GET(request, makeParams('p1'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.documents).toEqual([])
    })

    it('sets cache headers', async () => {
      ;(prisma.projectDocument.findMany as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/projects/p1/documents')
      const response = await GET(request, makeParams('p1'))

      expect(response.headers.get('Cache-Control')).toContain('public')
    })

    it('returns 500 on database error', async () => {
      ;(prisma.projectDocument.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/projects/p1/documents')
      const response = await GET(request, makeParams('p1'))

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when not authorized', async () => {
      mockVerifyAdminAuth.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/projects/p1/documents?documentId=d1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, makeParams('p1'))

      expect(response.status).toBe(401)
    })

    it('returns 400 when documentId missing', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/projects/p1/documents', {
        method: 'DELETE',
      })
      const response = await DELETE(request, makeParams('p1'))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('documentId')
    })

    it('returns 404 when document not found', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      ;(prisma.projectDocument.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/projects/p1/documents?documentId=d1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, makeParams('p1'))

      expect(response.status).toBe(404)
    })

    it('deletes document and removes from storage', async () => {
      mockVerifyAdminAuth.mockResolvedValue(true)
      const mockDoc = {
        id: 'd1',
        url: 'http://storage.com/project-images/documents/p1/test.pdf',
      }
      ;(prisma.projectDocument.findUnique as jest.Mock).mockResolvedValue(mockDoc)
      ;(prisma.projectDocument.delete as jest.Mock).mockResolvedValue({})

      const mockRemove = jest.fn().mockResolvedValue({})
      ;(supabase.storage.from as jest.Mock).mockReturnValue({ remove: mockRemove })

      const request = new NextRequest('http://localhost/api/projects/p1/documents?documentId=d1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, makeParams('p1'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.projectDocument.delete).toHaveBeenCalledWith({ where: { id: 'd1' } })
    })
  })
})
