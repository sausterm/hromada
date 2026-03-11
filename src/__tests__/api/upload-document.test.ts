/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/upload/document/route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyPartnerAuth: jest.fn(),
}))

// Mock S3
jest.mock('@/lib/s3', () => ({
  uploadDocumentToStaging: jest.fn(),
  buildDocumentKey: jest.fn().mockReturnValue('partner-org/project-name/doc.pdf'),
}))

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue(null),
}))

import { verifyPartnerAuth } from '@/lib/auth'
import { uploadDocumentToStaging, buildDocumentKey } from '@/lib/s3'
import { rateLimit } from '@/lib/rate-limit'

// PDF magic bytes: %PDF
const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])

function createPdfFile(name: string, sizeBytes?: number): File {
  const content = sizeBytes
    ? new Uint8Array(sizeBytes)
    : PDF_HEADER
  // If we need a specific size, copy PDF header into the beginning
  if (sizeBytes) {
    content.set(PDF_HEADER)
  }
  return new File([content], name, { type: 'application/pdf' })
}

function createMockRequest(fields: Record<string, string | File>): NextRequest {
  const formData = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value)
  }
  return {
    formData: () => Promise.resolve(formData),
    headers: new Headers(),
    ip: '127.0.0.1',
    url: 'http://localhost/api/upload/document',
  } as unknown as NextRequest
}

describe('POST /api/upload/document', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest({
      file: createPdfFile('doc.pdf'),
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no userId', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: null })

    const request = createMockRequest({
      file: createPdfFile('doc.pdf'),
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('returns rate limit response when rate limited', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    const rateLimitResp = new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429 })
    ;(rateLimit as jest.Mock).mockReturnValue(rateLimitResp)

    const request = createMockRequest({
      file: createPdfFile('doc.pdf'),
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(429)
  })

  it('returns 400 when no file provided', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    const request = createMockRequest({
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('No file provided')
  })

  it('returns 400 when partnerOrg or projectName missing', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    const request = createMockRequest({
      file: createPdfFile('doc.pdf'),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('partnerOrg and projectName are required')
  })

  it('returns 400 for non-PDF content type', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    const file = new File(['not a pdf'], 'doc.txt', { type: 'text/plain' })
    const request = createMockRequest({
      file,
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Only PDF files are accepted.')
  })

  it('returns 400 for file exceeding 20MB', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    const file = createPdfFile('huge.pdf', 21 * 1024 * 1024)
    const request = createMockRequest({
      file,
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('File too large')
  })

  it('returns 400 for file with PDF content type but invalid magic bytes', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    const file = new File([new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00])], 'fake.pdf', {
      type: 'application/pdf',
    })
    const request = createMockRequest({
      file,
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('File content is not a valid PDF.')
  })

  it('returns 503 when S3 is not configured', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)
    ;(uploadDocumentToStaging as jest.Mock).mockResolvedValue(null)

    const request = createMockRequest({
      file: createPdfFile('doc.pdf'),
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    expect(response.status).toBe(503)
    const data = await response.json()
    expect(data.error).toBe('Document storage is not configured.')
  })

  it('uploads document successfully', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)
    ;(uploadDocumentToStaging as jest.Mock).mockResolvedValue({ key: 'partner-org/project-name/doc.pdf' })
    ;(buildDocumentKey as jest.Mock).mockReturnValue('partner-org/project-name/doc.pdf')

    const file = createPdfFile('doc.pdf')
    const request = createMockRequest({
      file,
      partnerOrg: 'Ecoaction',
      projectName: 'Horenka',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.key).toBe('partner-org/project-name/doc.pdf')
    expect(data.filename).toBe('doc.pdf')
    expect(buildDocumentKey).toHaveBeenCalledWith('Ecoaction', 'Horenka', 'doc.pdf')
    expect(uploadDocumentToStaging).toHaveBeenCalledWith(
      'partner-org/project-name/doc.pdf',
      expect.any(Buffer),
      'application/pdf',
      'doc.pdf'
    )
  })

  it('returns 500 on unexpected error', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue({ userId: 'u1' })
    ;(rateLimit as jest.Mock).mockReturnValue(null)

    // Make formData throw
    const request = {
      formData: () => Promise.reject(new Error('FormData error')),
      headers: new Headers(),
      ip: '127.0.0.1',
      url: 'http://localhost/api/upload/document',
    } as unknown as NextRequest

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const response = await POST(request)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to upload document')

    consoleSpy.mockRestore()
  })
})
