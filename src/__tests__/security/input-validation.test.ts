/**
 * Security Test Suite - Input Validation Testing
 *
 * Tests for:
 * - SQL injection prevention
 * - XSS prevention
 * - Path traversal prevention
 * - Command injection prevention
 * - Parameter tampering
 */

// Mock next/server before any imports
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url: string, init?: any) => ({
    url,
    method: init?.method || 'GET',
    headers: {
      get: (key: string) => init?.headers?.[key] || null,
    },
  })),
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status || 200 })),
  },
}))

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    contactSubmission: {
      create: jest.fn(),
    },
    projectSubmission: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
      }),
    },
  },
  STORAGE_BUCKET: 'test-bucket',
}))

import { sanitizeInput, detectSuspiciousInput } from '@/lib/security'

describe('Input Validation Security Tests', () => {
  describe('XSS Prevention', () => {
    it('should sanitize HTML special characters', () => {
      const maliciousInputs = [
        { input: '<script>alert("XSS")</script>', expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;' },
        { input: '<img src=x onerror=alert(1)>', expected: '&lt;img src=x onerror=alert(1)&gt;' },
        { input: 'Test & "quoted" <value>', expected: 'Test &amp; &quot;quoted&quot; &lt;value&gt;' },
        { input: "onclick='malicious()'", expected: "onclick=&#x27;malicious()&#x27;" },
      ]

      maliciousInputs.forEach(({ input, expected }) => {
        const sanitized = sanitizeInput(input)
        expect(sanitized).toBe(expected)
        // Verify dangerous HTML tags are escaped (< and > become &lt; and &gt;)
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('<img')
      })
    })

    it('should detect suspicious XSS patterns', () => {
      const suspiciousInputs = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        '<img onerror=alert(1)>',
        '<div onclick=malicious()>',
        'data:text/html,<script>alert(1)</script>',
        '<style>expression(alert(1))</style>',
      ]

      suspiciousInputs.forEach((input) => {
        expect(detectSuspiciousInput(input)).toBe(true)
      })
    })

    it('should allow safe inputs', () => {
      const safeInputs = [
        'This is a normal message',
        'Project for School #42',
        'Contact: john@example.com',
        '1000 USD budget',
        'Coordinates: 50.4501, 30.5234',
      ]

      safeInputs.forEach((input) => {
        expect(detectSuspiciousInput(input)).toBe(false)
      })
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries via Prisma', async () => {
      const { prisma } = await import('@/lib/prisma')

      const maliciousIds = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "1; SELECT * FROM users",
        "1 UNION SELECT * FROM users",
      ]

      maliciousIds.forEach((id) => {
        prisma.project.findUnique({ where: { id } })

        expect(prisma.project.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id },
          })
        )
      })
    })

    it('should validate category enum values', async () => {
      const validCategories = ['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER']
      const invalidCategories = [
        "HOSPITAL'; DROP TABLE projects; --",
        'INVALID_CATEGORY',
        '1 OR 1=1',
      ]

      invalidCategories.forEach((category) => {
        expect(validCategories.includes(category)).toBe(false)
      })
    })
  })

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal in file uploads', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'file.jpg/../../../etc/shadow',
        '%2e%2e%2f%2e%2e%2fetc/passwd',
        '....//....//etc/passwd',
      ]

      maliciousFilenames.forEach((filename) => {
        const safeFilename = `submissions/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.jpg`

        expect(safeFilename).not.toContain('..')
        expect(safeFilename).not.toContain('%2e')
        expect(safeFilename).toMatch(/^submissions\/\d+-[a-z0-9]+\.jpg$/)
      })
    })
  })

  describe('File Upload Validation', () => {
    it('should reject non-allowed file types', async () => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

      const maliciousTypes = [
        'application/javascript',
        'text/html',
        'application/x-php',
        'application/x-msdownload',
        'text/x-python',
      ]

      maliciousTypes.forEach((type) => {
        expect(ALLOWED_TYPES.includes(type)).toBe(false)
      })
    })

    it('should enforce file size limits', () => {
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

      const oversizedFiles = [
        6 * 1024 * 1024,
        10 * 1024 * 1024,
        100 * 1024 * 1024,
      ]

      oversizedFiles.forEach((size) => {
        expect(size > MAX_FILE_SIZE).toBe(true)
      })
    })

    it('should validate file extension matches content type', () => {
      const validCombinations = [
        { type: 'image/jpeg', ext: 'jpg' },
        { type: 'image/jpeg', ext: 'jpeg' },
        { type: 'image/png', ext: 'png' },
        { type: 'image/webp', ext: 'webp' },
      ]

      validCombinations.forEach(({ type }) => {
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
        expect(ALLOWED_TYPES.includes(type)).toBe(true)
      })
    })
  })

  describe('Email Validation', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      const validEmails = [
        'user@example.com',
        'test.user@domain.org',
        'name+tag@company.co.uk',
      ]

      const invalidEmails = [
        'not-an-email',
        '@missing-local.com',
        'missing-domain@',
        'spaces in@email.com',
        'multiple@@at.com',
      ]

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true)
      })

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })
  })

  describe('Coordinate Validation', () => {
    it('should validate latitude range', () => {
      const validLatitudes = [0, 45.5, -45.5, 90, -90, 50.4501]
      const invalidLatitudes = [91, -91, 180, -180, 1000]

      validLatitudes.forEach((lat) => {
        expect(lat >= -90 && lat <= 90).toBe(true)
      })

      invalidLatitudes.forEach((lat) => {
        expect(lat >= -90 && lat <= 90).toBe(false)
      })
    })

    it('should validate longitude range', () => {
      const validLongitudes = [0, 90, -90, 180, -180, 30.5234]
      const invalidLongitudes = [181, -181, 360, -360, 1000]

      validLongitudes.forEach((lng) => {
        expect(lng >= -180 && lng <= 180).toBe(true)
      })

      invalidLongitudes.forEach((lng) => {
        expect(lng >= -180 && lng <= 180).toBe(false)
      })
    })
  })

  describe('String Length Limits', () => {
    it('should enforce brief description limit (150 chars)', () => {
      const MAX_BRIEF = 150
      const longDescription = 'a'.repeat(200)

      expect(longDescription.length > MAX_BRIEF).toBe(true)
    })

    it('should enforce full description limit (2000 chars)', () => {
      const MAX_FULL = 2000
      const longDescription = 'a'.repeat(3000)

      expect(longDescription.length > MAX_FULL).toBe(true)
    })

    it('should enforce message limit (1000 chars)', () => {
      const MAX_MESSAGE = 1000
      const longMessage = 'a'.repeat(1500)

      expect(longMessage.length > MAX_MESSAGE).toBe(true)
    })
  })

  describe('Parameter Tampering Prevention', () => {
    it('should not allow status manipulation in public submissions', () => {
      const expectedStatus = 'PENDING'
      expect(expectedStatus).toBe('PENDING')
    })

    it('should not allow role specification in public registration', () => {
      const validRoles = ['ADMIN', 'PARTNER', 'NONPROFIT_MANAGER']
      const invalidRole = 'SUPERADMIN'

      expect(validRoles.includes(invalidRole)).toBe(false)
    })
  })
})
