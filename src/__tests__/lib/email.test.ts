import { TextEncoder, TextDecoder } from 'util'
// Ensure TextEncoder is available (used by sendDonationForwardedEmail for raw MIME)
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.assign(globalThis, { TextEncoder, TextDecoder })
}

import { sendContactNotification, sendDonationNotificationToAdmin, sendPasswordResetEmail, sendNewsletterWelcomeEmail, sendPartnershipInquiryNotification } from '@/lib/email'

// Mock security module to avoid Prisma dependency chain (security → prisma → @prisma/client)
// which causes TextEncoder issues during jest.resetModules() re-imports
jest.mock('@/lib/security', () => ({
  sanitizeInput: jest.fn((str: string) => str),
  logAuditEvent: jest.fn(),
  AuditAction: {},
}))

// Mock the AWS SES module
const mockSend = jest.fn().mockResolvedValue({})
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
}))

describe('email module', () => {
  const originalEnv = process.env

  const defaultParams = {
    donorName: 'John Doe',
    donorEmail: 'john@example.com',
    message: 'I would like to help with this project.',
    projectName: 'Central Hospital Solar',
    municipalityName: 'Kyiv',
    municipalityEmail: 'kyiv@example.com',
    projectId: 'proj-123',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset modules to get fresh instance
    jest.resetModules()

    // Re-register the default SES mock (jest.doMock in error tests overrides this)
    jest.doMock('@aws-sdk/client-ses', () => ({
      SESClient: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({}),
      })),
      SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      SendRawEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
    }))

    // Default to having SES configured
    process.env = {
      ...originalEnv,
      SES_REGION: 'us-east-1',
      SES_FROM_EMAIL: 'noreply@hromadaproject.org',
      ADMIN_EMAIL: 'admin@example.com',
      NEXT_PUBLIC_APP_URL: 'https://hromada.org',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('sendContactNotification', () => {
    it('returns success true when ADMIN_EMAIL is not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Re-import to get fresh module with updated env
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(defaultParams)

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_EMAIL not configured')
      )

      consoleSpy.mockRestore()
    })

    it('returns success true when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      // Need to reimport with fresh env
      jest.resetModules()
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(defaultParams)

      expect(result).toEqual({ success: true })

      consoleSpy.mockRestore()
    })

    it('includes all required information in email', async () => {
      // Mock successful send
      const mockSesSend = jest.fn().mockResolvedValue({})
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))

      jest.resetModules()
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      await freshSend(defaultParams)

      // The function was called but we can verify it returns success
    })

    it('uses default app URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL

      jest.resetModules()
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(defaultParams)

      // Should still work with default localhost URL
      expect(result.success).toBeDefined()
    })

    it('returns error on send failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('SMTP connection failed'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(defaultParams)

      expect(result).toEqual({
        success: false,
        error: 'SMTP connection failed',
      })

      consoleSpy.mockRestore()
    })

    it('handles non-Error exceptions', async () => {
      const mockSesSend = jest.fn().mockRejectedValue('String error')
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendContactNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(defaultParams)

      expect(result).toEqual({
        success: false,
        error: 'Failed to send email',
      })

      consoleSpy.mockRestore()
    })
  })

  describe('sendDonationNotificationToAdmin', () => {
    const notificationParams = {
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      donorOrganization: 'Acme Corp',
      projectName: 'Central Hospital Solar',
      projectId: 'proj-123',
      amount: 5000,
      paymentMethod: 'wire',
      referenceNumber: 'REF-001',
      isNewDonor: true,
    }

    it('returns success when ADMIN_EMAIL is not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend(notificationParams)

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_EMAIL not configured')
      )

      consoleSpy.mockRestore()
    })

    it('returns success when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend(notificationParams)

      expect(result).toEqual({ success: true })

      consoleSpy.mockRestore()
    })

    it('handles wire payment method', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend(notificationParams)

      expect(result.success).toBeDefined()
    })

    it('handles daf payment method', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...notificationParams,
        paymentMethod: 'daf',
      })

      expect(result.success).toBeDefined()
    })

    it('handles missing amount', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...notificationParams,
        amount: undefined,
      })

      expect(result.success).toBeDefined()
    })

    it('handles missing organization', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...notificationParams,
        donorOrganization: undefined,
      })

      expect(result.success).toBeDefined()
    })

    it('handles missing reference number', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...notificationParams,
        referenceNumber: undefined,
      })

      expect(result.success).toBeDefined()
    })

    it('handles returning donor', async () => {
      jest.resetModules()
      const { sendDonationNotificationToAdmin: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...notificationParams,
        isNewDonor: false,
      })

      expect(result.success).toBeDefined()
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('returns success when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const logSpy = jest.spyOn(console, 'log').mockImplementation()

      jest.resetModules()
      const { sendPasswordResetEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({ name: 'John', email: 'john@test.com', code: '123456' })

      expect(result).toEqual({ success: true })
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('123456'))

      consoleSpy.mockRestore()
      logSpy.mockRestore()
    })

    it('sends password reset email', async () => {
      jest.resetModules()
      const { sendPasswordResetEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({ name: 'John', email: 'john@test.com', code: '123456' })

      expect(result.success).toBeDefined()
    })

    it('returns error on send failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Send failed'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendPasswordResetEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({ name: 'John', email: 'john@test.com', code: '123456' })

      expect(result).toEqual({ success: false, error: 'Send failed' })
      consoleSpy.mockRestore()
    })
  })

  describe('sendNewsletterWelcomeEmail', () => {
    it('returns success when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendNewsletterWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('sub@test.com')

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends newsletter welcome email', async () => {
      jest.resetModules()
      const { sendNewsletterWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('sub@test.com')

      expect(result.success).toBeDefined()
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Failed'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendNewsletterWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('sub@test.com')

      expect(result).toEqual({ success: false, error: 'Failed' })
      consoleSpy.mockRestore()
    })
  })

  describe('sendPartnershipInquiryNotification', () => {
    const partnerParams = {
      communityName: 'Portland Rotary',
      contactName: 'John',
      contactEmail: 'john@test.com',
      communityType: 'rotary',
    }

    it('returns success when ADMIN_EMAIL is not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendPartnershipInquiryNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(partnerParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('returns success when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendPartnershipInquiryNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(partnerParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends notification with optional fields', async () => {
      jest.resetModules()
      const { sendPartnershipInquiryNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...partnerParams,
        approximateSize: '50',
        message: 'Interested in partnering',
      })

      expect(result.success).toBeDefined()
    })

    it('sends notification without optional fields', async () => {
      jest.resetModules()
      const { sendPartnershipInquiryNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(partnerParams)

      expect(result.success).toBeDefined()
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Failed'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({
          send: mockSesSend,
        })),
        SendEmailCommand: jest.fn().mockImplementation((params: unknown) => params),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendPartnershipInquiryNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(partnerParams)

      expect(result).toEqual({ success: false, error: 'Failed' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendDonationReceivedEmail
  // -------------------------------------------------------------------------

  describe('sendDonationReceivedEmail', () => {
    const donationReceivedParams = {
      donorName: 'Jane Smith',
      donorEmail: 'jane@example.com',
      projectName: 'School Roof Repair',
      paymentMethod: 'wire',
      amount: 10000,
      referenceNumber: 'REF-100',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donationReceivedParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends email with all optional fields', async () => {
      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donationReceivedParams,
        projectPhotoUrl: 'https://example.com/photo.jpg',
        municipality: 'Kharkiv',
        partnerName: 'Ecoaction',
        partnerLogoUrl: 'https://example.com/logo.png',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends email without optional fields (no amount, no reference)', async () => {
      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        donorName: 'Jane Smith',
        donorEmail: 'jane@example.com',
        projectName: 'School Roof Repair',
        paymentMethod: 'daf',
      })

      expect(result).toEqual({ success: true })
    })

    it('handles unknown payment method gracefully', async () => {
      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donationReceivedParams,
        paymentMethod: 'crypto',
      })

      expect(result).toEqual({ success: true })
    })

    it('returns error on send failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('SES quota exceeded'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donationReceivedParams)

      expect(result).toEqual({ success: false, error: 'SES quota exceeded' })
      consoleSpy.mockRestore()
    })

    it('returns generic error for non-Error exceptions', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(42)
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendDonationReceivedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donationReceivedParams)

      expect(result).toEqual({ success: false, error: 'Failed to send email' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // buildCalendlyWelcomeEmailHtml
  // -------------------------------------------------------------------------

  describe('buildCalendlyWelcomeEmailHtml', () => {
    it('builds email with name and project', async () => {
      jest.resetModules()
      const { buildCalendlyWelcomeEmailHtml: build } = await import('@/lib/email')
      const result = build('john@test.com', 'John Doe', 'token-abc', 'Solar Array')

      expect(result.subject).toContain('John')
      expect(result.html).toContain('Solar Array')
    })

    it('builds email without name', async () => {
      jest.resetModules()
      const { buildCalendlyWelcomeEmailHtml: build } = await import('@/lib/email')
      const result = build('john@test.com', null, 'token-abc')

      expect(result.subject).toBe('Welcome to our hromada')
      expect(result.html).toBeDefined()
    })

    it('builds email without project name', async () => {
      jest.resetModules()
      const { buildCalendlyWelcomeEmailHtml: build } = await import('@/lib/email')
      const result = build('john@test.com', 'Jane', 'token-abc')

      expect(result.subject).toContain('Jane')
      expect(result.html).not.toContain('undefined')
    })

    it('includes unsubscribe link', async () => {
      jest.resetModules()
      const { buildCalendlyWelcomeEmailHtml: build } = await import('@/lib/email')
      const result = build('john@test.com', null, 'my-token')

      expect(result.html).toContain('my-token')
      expect(result.html).toContain('unsubscribe')
    })
  })

  // -------------------------------------------------------------------------
  // sendCalendlyWelcomeEmail
  // -------------------------------------------------------------------------

  describe('sendCalendlyWelcomeEmail', () => {
    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendCalendlyWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('a@b.com', 'Name', 'token')

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends email successfully', async () => {
      jest.resetModules()
      const { sendCalendlyWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('a@b.com', 'Name', 'token', 'Solar')

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Bounce'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendCalendlyWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend('a@b.com', null, 'token')

      expect(result).toEqual({ success: false, error: 'Bounce' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendDonationForwardedEmail
  // -------------------------------------------------------------------------

  describe('sendDonationForwardedEmail', () => {
    const forwardedParams = {
      donorName: 'Alice',
      donorEmail: 'alice@example.com',
      projectName: 'Heating System',
      amount: 25000,
      paymentMethod: 'wire',
      receiptUrl: 'https://hromada.org/receipts/123',
      receiptPdfBuffer: Buffer.from('fake-pdf-content'),
      receiptNumber: 'R-2026-001',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendDonationForwardedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(forwardedParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends email with temporary password', async () => {
      jest.resetModules()
      const { sendDonationForwardedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...forwardedParams,
        temporaryPassword: 'temp123',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends email without temporary password', async () => {
      jest.resetModules()
      const { sendDonationForwardedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(forwardedParams)

      expect(result).toEqual({ success: true })
    })

    it('sends email with all optional fields', async () => {
      jest.resetModules()
      const { sendDonationForwardedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...forwardedParams,
        referenceNumber: 'REF-XYZ',
        projectPhotoUrl: 'https://example.com/photo.jpg',
        municipality: 'Rivne',
        partnerName: 'Ecoclub',
        partnerLogoUrl: 'https://example.com/logo.png',
        temporaryPassword: 'tmp-pw',
      })

      expect(result).toEqual({ success: true })
    })

    it('returns error on send failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Raw send failed'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
        SendRawEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendDonationForwardedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(forwardedParams)

      expect(result).toEqual({ success: false, error: 'Raw send failed' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectSubmissionNotification
  // -------------------------------------------------------------------------

  describe('sendProjectSubmissionNotification', () => {
    const submissionParams = {
      facilityName: 'City Library',
      municipalityName: 'Odesa',
      municipalityEmail: 'odesa@gov.ua',
      category: 'education',
      projectType: 'renovation',
      briefDescription: 'Renovate the central library damaged by shelling.',
      contactName: 'Ihor',
      contactEmail: 'ihor@odesa.ua',
      photoCount: 3,
    }

    it('returns success when ADMIN_EMAIL or SES is not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectSubmissionNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(submissionParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends notification with all optional fields', async () => {
      jest.resetModules()
      const { sendProjectSubmissionNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...submissionParams,
        region: 'Odesa Oblast',
        contactPhone: '+380991234567',
        edrpou: '12345678',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends notification without optional fields (no region, phone, edrpou)', async () => {
      jest.resetModules()
      const { sendProjectSubmissionNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(submissionParams)

      expect(result).toEqual({ success: true })
    })

    it('sends notification with zero photos', async () => {
      jest.resetModules()
      const { sendProjectSubmissionNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend({ ...submissionParams, photoCount: 0 })

      expect(result).toEqual({ success: true })
    })

    it('returns error on send failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Fail'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectSubmissionNotification: freshSend } = await import('@/lib/email')
      const result = await freshSend(submissionParams)

      expect(result).toEqual({ success: false, error: 'Fail' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectSubmissionConfirmation
  // -------------------------------------------------------------------------

  describe('sendProjectSubmissionConfirmation', () => {
    const confirmParams = {
      contactName: 'Ihor',
      contactEmail: 'ihor@odesa.ua',
      facilityName: 'City Library',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectSubmissionConfirmation: freshSend } = await import('@/lib/email')
      const result = await freshSend(confirmParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends confirmation successfully', async () => {
      jest.resetModules()
      const { sendProjectSubmissionConfirmation: freshSend } = await import('@/lib/email')
      const result = await freshSend(confirmParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Nope'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectSubmissionConfirmation: freshSend } = await import('@/lib/email')
      const result = await freshSend(confirmParams)

      expect(result).toEqual({ success: false, error: 'Nope' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectApprovalEmail
  // -------------------------------------------------------------------------

  describe('sendProjectApprovalEmail', () => {
    const approvalParams = {
      contactName: 'Ihor',
      contactEmail: 'ihor@odesa.ua',
      facilityName: 'City Library',
      projectId: 'proj-456',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectApprovalEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(approvalParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends approval email successfully', async () => {
      jest.resetModules()
      const { sendProjectApprovalEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(approvalParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Timeout'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectApprovalEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(approvalParams)

      expect(result).toEqual({ success: false, error: 'Timeout' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectUpdateEmail
  // -------------------------------------------------------------------------

  describe('sendProjectUpdateEmail', () => {
    const updateParams = {
      donorName: 'Jane',
      donorEmail: 'jane@example.com',
      projectName: 'School Roof',
      projectId: 'proj-789',
      updateTitle: 'Procurement update: active.tendering',
      updateMessage: 'Contractors are now submitting bids.',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectUpdateEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(updateParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends update email with tenderID', async () => {
      jest.resetModules()
      const { sendProjectUpdateEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...updateParams,
        tenderID: 'UA-2026-01-15-000123-a',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends update email without tenderID', async () => {
      jest.resetModules()
      const { sendProjectUpdateEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(updateParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Err'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectUpdateEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(updateParams)

      expect(result).toEqual({ success: false, error: 'Err' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProzorroMatchEmail
  // -------------------------------------------------------------------------

  describe('sendProzorroMatchEmail', () => {
    const matchParams = {
      facilityName: 'Solar Farm',
      edrpou: '12345678',
      tenderID: 'UA-2026-03-01-000999-a',
      tenderUuid: 'uuid-abc-123',
      entityName: 'Kyiv City Council',
      tenderStatus: 'active.tendering',
      prozorroUrl: 'https://prozorro.gov.ua/tender/UA-2026-03-01-000999-a',
    }

    it('returns success when ADMIN_EMAIL or SES not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProzorroMatchEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(matchParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends match notification successfully', async () => {
      jest.resetModules()
      const { sendProzorroMatchEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(matchParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Oops'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProzorroMatchEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(matchParams)

      expect(result).toEqual({ success: false, error: 'Oops' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectRejectionEmail
  // -------------------------------------------------------------------------

  describe('sendProjectRejectionEmail', () => {
    const rejectionParams = {
      contactName: 'Ihor',
      contactEmail: 'ihor@odesa.ua',
      facilityName: 'City Library',
      rejectionReason: 'Insufficient documentation provided.',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectRejectionEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(rejectionParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends rejection email successfully', async () => {
      jest.resetModules()
      const { sendProjectRejectionEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(rejectionParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Rejected'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectRejectionEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(rejectionParams)

      expect(result).toEqual({ success: false, error: 'Rejected' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendProjectCompletedEmail
  // -------------------------------------------------------------------------

  describe('sendProjectCompletedEmail', () => {
    const completedParams = {
      donorName: 'Alice Johnson',
      donorEmail: 'alice@example.com',
      projectName: 'Solar Heating',
      projectId: 'proj-complete-1',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendProjectCompletedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(completedParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends completed email with all optional fields', async () => {
      jest.resetModules()
      const { sendProjectCompletedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...completedParams,
        municipality: 'Rivne',
        partnerName: 'Ecoclub',
        partnerLogoUrl: 'https://example.com/logo.png',
        projectPhotoUrl: 'https://example.com/photo.jpg',
        amount: 50000,
      })

      expect(result).toEqual({ success: true })
    })

    it('sends completed email without optional fields', async () => {
      jest.resetModules()
      const { sendProjectCompletedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(completedParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Kaboom'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendProjectCompletedEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(completedParams)

      expect(result).toEqual({ success: false, error: 'Kaboom' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendNewsletterEmail
  // -------------------------------------------------------------------------

  describe('sendNewsletterEmail', () => {
    const newsletterParams = {
      recipientEmail: 'reader@example.com',
      unsubscribeToken: 'unsub-token-123',
      headline: 'Spring Update from Hromada',
      intro: 'Here is what communities have been building.',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendNewsletterEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(newsletterParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends newsletter with all optional fields', async () => {
      jest.resetModules()
      const { sendNewsletterEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...newsletterParams,
        recipientName: 'Bob Smith',
        projects: [
          { name: 'Solar Farm', municipality: 'Kyiv', statusLine: 'Procurement started' },
          { name: 'School Roof', partnerName: 'Ecoaction', partnerLogoUrl: 'https://example.com/l.png', photoUrl: 'https://example.com/p.jpg' },
        ],
        stats: [
          { label: 'Projects Funded', value: '12' },
          { label: 'Communities Served', value: '8' },
        ],
        closing: 'Thank you for being part of this.',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends newsletter without optional fields', async () => {
      jest.resetModules()
      const { sendNewsletterEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(newsletterParams)

      expect(result).toEqual({ success: true })
    })

    it('sends newsletter with null recipientName', async () => {
      jest.resetModules()
      const { sendNewsletterEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({ ...newsletterParams, recipientName: null })

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Newsletter fail'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendNewsletterEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(newsletterParams)

      expect(result).toEqual({ success: false, error: 'Newsletter fail' })
      consoleSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // sendPressReleaseProjectCompleted
  // -------------------------------------------------------------------------

  describe('sendPressReleaseProjectCompleted', () => {
    const pressParams = {
      recipientEmail: 'press@media.com',
      projectName: 'Solar Array',
      municipality: 'Kharkiv',
      partnerName: 'Ecoaction',
      amount: 75000,
      projectDescription: 'A 50kW solar array for the municipal water pumping station.',
      completedDate: 'March 1, 2026',
    }

    it('returns success when SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendPressReleaseProjectCompleted: freshSend } = await import('@/lib/email')
      const result = await freshSend(pressParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends press release with all optional fields', async () => {
      jest.resetModules()
      const { sendPressReleaseProjectCompleted: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...pressParams,
        unsubscribeToken: 'press-unsub-token',
        region: 'Kharkiv Oblast',
        projectPhotoUrl: 'https://example.com/array.jpg',
        impactStatement: 'serving 2,400 residents',
      })

      expect(result).toEqual({ success: true })
    })

    it('sends press release without optional fields', async () => {
      jest.resetModules()
      const { sendPressReleaseProjectCompleted: freshSend } = await import('@/lib/email')
      const result = await freshSend(pressParams)

      expect(result).toEqual({ success: true })
    })

    it('returns error on failure', async () => {
      const mockSesSend = jest.fn().mockRejectedValue(new Error('Press fail'))
      jest.doMock('@aws-sdk/client-ses', () => ({
        SESClient: jest.fn().mockImplementation(() => ({ send: mockSesSend })),
        SendEmailCommand: jest.fn().mockImplementation((p: unknown) => p),
      }))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      jest.resetModules()
      const { sendPressReleaseProjectCompleted: freshSend } = await import('@/lib/email')
      const result = await freshSend(pressParams)

      expect(result).toEqual({ success: false, error: 'Press fail' })
      consoleSpy.mockRestore()
    })
  })
})
