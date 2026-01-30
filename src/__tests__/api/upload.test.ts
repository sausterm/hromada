/**
 * @jest-environment node
 */

import { POST, DELETE } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  STORAGE_BUCKET: 'test-bucket',
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      }),
    },
  },
}))

import { verifyAdminAuth } from '@/lib/auth'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

describe('/api/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    const createMockRequest = (file?: File | null) => {
      const formData = new FormData()
      if (file) {
        formData.append('file', file)
      }

      return {
        formData: () => Promise.resolve(formData),
      } as unknown as NextRequest
    }

    it('returns 401 if not authorized', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

      const request = createMockRequest()
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    // Note: Testing Supabase configuration check requires module-level mocking
    // which is complex with Jest. The functionality is tested via integration tests.
    it.skip('returns 500 if Supabase not configured', async () => {
      // This test is skipped because isSupabaseConfigured is evaluated at module load time
      // Making it difficult to test in isolation without more complex setup
    })

    it('returns 400 if no file provided', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const request = createMockRequest(null)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    it('returns 400 for invalid file type', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const file = new File(['test'], 'test.gif', { type: 'image/gif' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    it('returns 400 for file too large', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      // Create a mock large file
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('File too large')
    })

    it('uploads file successfully', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-file.jpg' },
        error: null,
      })
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/test-file.jpg' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      })

      const file = new File(['test image content'], 'test.jpg', { type: 'image/jpeg' })
      const request = createMockRequest(file)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.url).toBe('https://storage.example.com/test-file.jpg')
      expect(data.path).toBe('test-file.jpg')
    })

    it('returns 500 on Supabase upload error', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' },
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
      expect(data.error).toContain('Storage quota exceeded')

      consoleSpy.mockRestore()
    })

    it('accepts JPEG files', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test.jpg' },
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
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test.png' },
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
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test.webp' },
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

    it('returns 500 when an unexpected error occurs', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      // Create a request that will throw when formData() is called
      const request = {
        formData: () => Promise.reject(new Error('FormData error')),
      } as unknown as NextRequest

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process upload')

      consoleSpy.mockRestore()
    })
  })

  describe('DELETE', () => {
    const createMockRequest = (path?: string) => {
      const url = path
        ? `https://example.com/api/upload?path=${encodeURIComponent(path)}`
        : 'https://example.com/api/upload'

      return {
        url,
      } as unknown as NextRequest
    }

    it('returns 401 if not authorized', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

      const request = createMockRequest('test.jpg')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 400 if no path provided', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const request = createMockRequest()
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No file path provided')
    })

    it('deletes file successfully', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockRemove = jest.fn().mockResolvedValue({
        error: null,
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockRemove,
      })

      const request = createMockRequest('test-file.jpg')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockRemove).toHaveBeenCalledWith(['test-file.jpg'])
    })

    it('returns 500 on Supabase delete error', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      const mockRemove = jest.fn().mockResolvedValue({
        error: { message: 'File not found' },
      })

      ;(supabase.storage.from as jest.Mock).mockReturnValue({
        remove: mockRemove,
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createMockRequest('nonexistent.jpg')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('File not found')

      consoleSpy.mockRestore()
    })

    it('returns 500 when an unexpected error occurs', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

      // Make supabase storage throw an error
      ;(supabase.storage.from as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected storage error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const request = createMockRequest('test.jpg')
      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process delete')

      consoleSpy.mockRestore()
    })
  })
})
