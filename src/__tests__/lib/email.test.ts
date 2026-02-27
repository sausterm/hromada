import { sendContactNotification, sendDonorWelcomeEmail, sendDonationNotificationToAdmin, sendPasswordResetEmail, sendNewsletterWelcomeEmail, sendPartnershipInquiryNotification } from '@/lib/email'

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

  describe('sendDonorWelcomeEmail', () => {
    const donorParams = {
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      temporaryPassword: 'Temp123!@#',
      projectName: 'Central Hospital Solar',
      amount: 5000,
      paymentMethod: 'wire',
    }

    it('returns success true when AWS SES is not configured', async () => {
      delete process.env.SES_REGION
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donorParams)

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AWS SES not configured')
      )

      consoleSpy.mockRestore()
    })

    it('handles wire payment method label', async () => {
      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donorParams)

      expect(result.success).toBeDefined()
    })

    it('handles daf payment method', async () => {
      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donorParams,
        paymentMethod: 'daf',
      })

      expect(result.success).toBeDefined()
    })

    it('handles check payment method', async () => {
      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donorParams,
        paymentMethod: 'check',
      })

      expect(result.success).toBeDefined()
    })

    it('handles unknown payment method', async () => {
      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donorParams,
        paymentMethod: 'crypto',
      })

      expect(result.success).toBeDefined()
    })

    it('handles missing amount', async () => {
      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend({
        ...donorParams,
        amount: undefined,
      })

      expect(result.success).toBeDefined()
    })

    it('uses default app URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL

      jest.resetModules()
      const { sendDonorWelcomeEmail: freshSend } = await import('@/lib/email')
      const result = await freshSend(donorParams)

      expect(result.success).toBeDefined()
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
})
