/**
 * Tests for src/lib/s3.ts
 */

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, _type: 'PutObject' })),
  CopyObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, _type: 'CopyObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, _type: 'DeleteObject' })),
}))

describe('s3', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv }
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe('buildDocumentKey', () => {
    it('sanitizes org, project, and filename', () => {
      // Need to import fresh each time since module has client singleton
      const { buildDocumentKey } = require('@/lib/s3')
      const key = buildDocumentKey('NGO EcoAction!', 'My Project #1', 'Cost Estimate.pdf')

      expect(key).toMatch(/^ngo-ecoaction\/my-project-1\/\d+-cost-estimate\.pdf$/)
    })

    it('handles special characters and multiple dashes', () => {
      const { buildDocumentKey } = require('@/lib/s3')
      const key = buildDocumentKey('org---name', 'proj!!!name', 'file   name.docx')

      expect(key).toMatch(/^org-name\/proj-name\/\d+-file-name\.docx$/)
    })

    it('uses last segment as extension when no dot present', () => {
      const { buildDocumentKey } = require('@/lib/s3')
      const key = buildDocumentKey('org', 'proj', 'noext')

      // When there's no dot, split('.').pop() returns the whole string
      expect(key).toMatch(/\.noext$/)
    })

    it('preserves various file extensions', () => {
      const { buildDocumentKey } = require('@/lib/s3')
      const key = buildDocumentKey('org', 'proj', 'photo.JPG')

      expect(key).toMatch(/\.jpg$/)
    })
  })

  describe('uploadDocumentToStaging', () => {
    it('returns null when S3 credentials missing', async () => {
      delete process.env.S3_ACCESS_KEY_ID
      delete process.env.S3_SECRET_ACCESS_KEY
      const { uploadDocumentToStaging } = require('@/lib/s3')

      const result = await uploadDocumentToStaging('key', Buffer.from('data'), 'application/pdf', 'file.pdf')
      expect(result).toBeNull()
    })

    it('uploads to staging bucket and returns key', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend.mockResolvedValue({})

      const { uploadDocumentToStaging } = require('@/lib/s3')
      const result = await uploadDocumentToStaging('org/proj/file.pdf', Buffer.from('data'), 'application/pdf', 'file.pdf')

      expect(result).toBe('org/proj/file.pdf')
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('throws on S3 send failure', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend.mockRejectedValue(new Error('S3 error'))

      const { uploadDocumentToStaging } = require('@/lib/s3')
      await expect(
        uploadDocumentToStaging('key', Buffer.from('data'), 'application/pdf', 'file.pdf')
      ).rejects.toThrow('S3 error')
    })
  })

  describe('promoteDocuments', () => {
    it('returns 0 for empty keys array', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      const { promoteDocuments } = require('@/lib/s3')

      const result = await promoteDocuments([])
      expect(result).toBe(0)
    })

    it('returns 0 when S3 not configured', async () => {
      delete process.env.S3_ACCESS_KEY_ID
      delete process.env.S3_SECRET_ACCESS_KEY
      const { promoteDocuments } = require('@/lib/s3')

      const result = await promoteDocuments(['key1'])
      expect(result).toBe(0)
    })

    it('copies to production and deletes from staging', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend.mockResolvedValue({})
      const { promoteDocuments } = require('@/lib/s3')

      const result = await promoteDocuments(['key1', 'key2'])
      expect(result).toBe(2)
      // 2 keys * 2 ops (copy + delete) = 4 send calls
      expect(mockSend).toHaveBeenCalledTimes(4)
    })

    it('continues on individual key failure', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend
        .mockRejectedValueOnce(new Error('copy failed'))
        .mockResolvedValue({})
      const { promoteDocuments } = require('@/lib/s3')

      const result = await promoteDocuments(['key1', 'key2'])
      // key1 fails on copy, key2 succeeds (copy + delete)
      expect(result).toBe(1)
    })
  })

  describe('deleteFromStaging', () => {
    it('returns 0 for empty keys', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      const { deleteFromStaging } = require('@/lib/s3')

      const result = await deleteFromStaging([])
      expect(result).toBe(0)
    })

    it('returns 0 when S3 not configured', async () => {
      delete process.env.S3_ACCESS_KEY_ID
      delete process.env.S3_SECRET_ACCESS_KEY
      const { deleteFromStaging } = require('@/lib/s3')

      const result = await deleteFromStaging(['key1'])
      expect(result).toBe(0)
    })

    it('deletes keys from staging bucket', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend.mockResolvedValue({})
      const { deleteFromStaging } = require('@/lib/s3')

      const result = await deleteFromStaging(['key1', 'key2'])
      expect(result).toBe(2)
      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('continues on individual key failure', async () => {
      process.env.S3_ACCESS_KEY_ID = 'test-key'
      process.env.S3_SECRET_ACCESS_KEY = 'test-secret'
      mockSend
        .mockRejectedValueOnce(new Error('delete failed'))
        .mockResolvedValue({})
      const { deleteFromStaging } = require('@/lib/s3')

      const result = await deleteFromStaging(['key1', 'key2'])
      expect(result).toBe(1)
    })
  })

  describe('getProductionUrl', () => {
    it('returns correct S3 URL', () => {
      const { getProductionUrl } = require('@/lib/s3')
      const url = getProductionUrl('org/proj/file.pdf')
      expect(url).toMatch(/https:\/\/hromada-partner-docs\.s3\..*\.amazonaws\.com\/org\/proj\/file\.pdf/)
    })
  })
})
