/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/test-emails/route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
}))

// Mock all email functions
jest.mock('@/lib/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendContactNotification: jest.fn().mockResolvedValue(undefined),
  sendDonationReceivedEmail: jest.fn().mockResolvedValue(undefined),
  sendDonationNotificationToAdmin: jest.fn().mockResolvedValue(undefined),
  sendNewsletterWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendCalendlyWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPartnershipInquiryNotification: jest.fn().mockResolvedValue(undefined),
  sendDonationForwardedEmail: jest.fn().mockResolvedValue(undefined),
  sendProjectSubmissionNotification: jest.fn().mockResolvedValue(undefined),
  sendProjectSubmissionConfirmation: jest.fn().mockResolvedValue(undefined),
  sendProjectApprovalEmail: jest.fn().mockResolvedValue(undefined),
  sendProjectUpdateEmail: jest.fn().mockResolvedValue(undefined),
  sendProzorroMatchEmail: jest.fn().mockResolvedValue(undefined),
  sendProjectRejectionEmail: jest.fn().mockResolvedValue(undefined),
  sendProjectCompletedEmail: jest.fn().mockResolvedValue(undefined),
}))

// Mock tax-receipt
jest.mock('@/lib/tax-receipt', () => ({
  generateTaxReceipt: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  generateReceiptNumber: jest.fn().mockReturnValue('REC-TEST-001'),
}))

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabaseAdmin: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://example.com/signed' } }),
      }),
    },
  },
  TAX_RECEIPTS_BUCKET: 'test-bucket',
}))

import { verifyAdminAuth } from '@/lib/auth'
import {
  sendPasswordResetEmail,
  sendContactNotification,
  sendDonationReceivedEmail,
  sendProjectCompletedEmail,
} from '@/lib/email'

// Make setTimeout resolve immediately so the route's sleep() calls don't block
const originalSetTimeout = global.setTimeout
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.setTimeout = ((fn: () => void) => {
    fn()
    return 0
  }) as any
})

afterAll(() => {
  global.setTimeout = originalSetTimeout
})

describe('POST /api/admin/test-emails', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
    // Restore default mock implementations after clearAllMocks
    ;(sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined)
    delete process.env.HROMADA_ADMIN_SECRET
  })

  it('returns 401 when not admin and no valid secret', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/test-emails', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('allows access with admin auth', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/test-emails', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.summary).toBeDefined()
    expect(Array.isArray(data.results)).toBe(true)
    expect(data.results.length).toBe(15)
  })

  it('allows access with valid admin secret header', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)
    process.env.HROMADA_ADMIN_SECRET = 'my-secret'

    const request = new NextRequest('http://localhost/api/admin/test-emails', {
      method: 'POST',
      headers: { 'x-admin-secret': 'my-secret' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results.length).toBe(15)
  })

  it('rejects invalid admin secret header', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)
    process.env.HROMADA_ADMIN_SECRET = 'my-secret'

    const request = new NextRequest('http://localhost/api/admin/test-emails', {
      method: 'POST',
      headers: { 'x-admin-secret': 'wrong-secret' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('sends only specific emails when ?only= is provided', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/test-emails?only=1,3', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // Only emails #1 and #3 should be in results
    expect(data.results.length).toBe(2)
    expect(data.results[0].id).toBe(1)
    expect(data.results[1].id).toBe(3)
    expect(sendPasswordResetEmail).toHaveBeenCalled()
    expect(sendDonationReceivedEmail).toHaveBeenCalled()
    expect(sendContactNotification).not.toHaveBeenCalled()
  })

  it('reports failed emails in results', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(sendPasswordResetEmail as jest.Mock).mockRejectedValue(new Error('SES error'))

    const request = new NextRequest('http://localhost/api/admin/test-emails?only=1', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results[0].status).toBe('failed')
    expect(data.results[0].error).toContain('SES error')
    expect(data.summary).toBe('0 sent, 1 failed')
  })

  it('returns correct summary counts', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/test-emails?only=1,15', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.summary).toBe('2 sent, 0 failed')
    expect(data.results).toHaveLength(2)
    expect(data.results.every((r: { status: string }) => r.status === 'sent')).toBe(true)
  })

  it('sends email #15 (Project Completed) correctly', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/test-emails?only=15', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results[0].name).toBe('Project Completed')
    expect(sendProjectCompletedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        donorName: 'Thomas',
        projectName: 'Horenka Central Hospital Heat Pump',
      })
    )
  })
})
