/**
 * @jest-environment node
 */

import { POST } from '@/app/api/upload/public/route'
import { NextRequest } from 'next/server'

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  STORAGE_BUCKET: 'test-bucket',
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  },
}))

import { supabase } from '@/lib/supabase'

describe('/api/upload/public', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createMockRequest = (file?: File | null) => {
    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    }

    return {
      formData: () => Promise.resolve(formData),
    } as unknown as NextRequest
  }

  describe('POST', () => {
    it('returns 500 if Supabase URL not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Storage not configured')
    })

    it('returns 500 if Supabase key not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Storage not configured')
    })

    it('returns 400 if no file provided', async () => {
      const request = createMockRequest(null)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('returns 400 for invalid file type', async () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    it('returns 400 for file too large', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024)
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('File too large')
    })

    it('uploads file to submissions folder', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'submissions/test-file.jpg' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/submissions/test-file.jpg' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.url).toBe('https://storage.example.com/submissions/test-file.jpg')
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^submissions\/\d+-[a-z0-9]+\.jpg$/),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      )
    })

    it('returns 500 on Supabase upload error', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Bucket not found')

      consoleSpy.mockRestore()
    })

    it('accepts JPEG files', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'submissions/test.jpg' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test.jpg' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test'], 'test.jpeg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('accepts PNG files', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'submissions/test.png' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test.png' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const request = createMockRequest(file)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('accepts WebP files', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'submissions/test.webp' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test.webp' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test'], 'test.webp', { type: 'image/webp' })
      const request = createMockRequest(file)
      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('handles files without extension by using filename as extension', async () => {
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'submissions/test.noextension' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test.noextension' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test'], 'noextension', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)

      expect(response.status).toBe(201)
      // Uses the filename itself when no extension found
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^submissions\/\d+-[a-z0-9]+\.noextension$/),
        expect.any(Buffer),
        expect.any(Object)
      )
    })

    it('returns 500 on unexpected error', async () => {
      const mockUpload = jest.fn().mockRejectedValue(new Error('Unexpected error'))

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process upload')

      consoleSpy.mockRestore()
    })
  })
})
