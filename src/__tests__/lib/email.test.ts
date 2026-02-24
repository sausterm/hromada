import {
  sendContactNotification,
  sendDonorWelcomeEmail,
  sendDonationNotificationToAdmin,
  sendPasswordResetEmail,
  sendNewsletterWelcomeEmail,
  sendPartnershipInquiryNotification,
  sendSubmissionAdminNotification,
  sendSubmissionConfirmationEmail,
  sendSubmissionDecisionEmail,
  sendDonationStatusEmail,
} from '@/lib/email'

// Mock security module to avoid Prisma dependency chain
jest.mock('@/lib/security', () => ({
  sanitizeInput: jest.fn((str: string) => str),
  logAuditEvent: jest.fn(),
  AuditAction: {},
}))

// Mock the SES module
const mockSendEmail = jest.fn()
jest.mock('@/lib/ses', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
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
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'test-msg-id' })

    process.env = {
      ...originalEnv,
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

      const result = await sendContactNotification(defaultParams)

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_EMAIL not configured')
      )
      expect(mockSendEmail).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('sends email via SES with correct params', async () => {
      const result = await sendContactNotification(defaultParams)

      expect(result).toEqual({ success: true, messageId: 'test-msg-id' })
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('Central Hospital Solar'),
        })
      )
    })

    it('uses default app URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL

      const result = await sendContactNotification(defaultParams)
      expect(result.success).toBe(true)
    })

    it('returns error on send failure', async () => {
      mockSendEmail.mockResolvedValue({ success: false, error: 'SES connection failed' })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendContactNotification(defaultParams)

      expect(result).toEqual({ success: false, error: 'SES connection failed' })
      consoleSpy.mockRestore()
    })

    it('handles thrown exceptions', async () => {
      mockSendEmail.mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendContactNotification(defaultParams)

      expect(result).toEqual({ success: false, error: 'Network error' })
      consoleSpy.mockRestore()
    })

    it('handles non-Error exceptions', async () => {
      mockSendEmail.mockRejectedValue('String error')
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendContactNotification(defaultParams)

      expect(result).toEqual({ success: false, error: 'Failed to send email' })
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

    it('sends email with correct subject', async () => {
      const result = await sendDonorWelcomeEmail(donorParams)

      expect(result).toEqual({ success: true, messageId: 'test-msg-id' })
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('Central Hospital Solar'),
        })
      )
    })

    it('handles daf payment method', async () => {
      const result = await sendDonorWelcomeEmail({ ...donorParams, paymentMethod: 'daf' })
      expect(result.success).toBe(true)
    })

    it('handles check payment method', async () => {
      const result = await sendDonorWelcomeEmail({ ...donorParams, paymentMethod: 'check' })
      expect(result.success).toBe(true)
    })

    it('handles unknown payment method', async () => {
      const result = await sendDonorWelcomeEmail({ ...donorParams, paymentMethod: 'crypto' })
      expect(result.success).toBe(true)
    })

    it('handles missing amount', async () => {
      const result = await sendDonorWelcomeEmail({ ...donorParams, amount: undefined })
      expect(result.success).toBe(true)
    })

    it('uses default app URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      const result = await sendDonorWelcomeEmail(donorParams)
      expect(result.success).toBe(true)
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

      const result = await sendDonationNotificationToAdmin(notificationParams)

      expect(result).toEqual({ success: true })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ADMIN_EMAIL not configured')
      )

      consoleSpy.mockRestore()
    })

    it('sends email with correct params', async () => {
      const result = await sendDonationNotificationToAdmin(notificationParams)

      expect(result).toEqual({ success: true, messageId: 'test-msg-id' })
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('$5,000'),
        })
      )
    })

    it('handles daf payment method', async () => {
      const result = await sendDonationNotificationToAdmin({ ...notificationParams, paymentMethod: 'daf' })
      expect(result.success).toBe(true)
    })

    it('handles missing amount', async () => {
      const result = await sendDonationNotificationToAdmin({ ...notificationParams, amount: undefined })
      expect(result.success).toBe(true)
    })

    it('handles missing organization', async () => {
      const result = await sendDonationNotificationToAdmin({ ...notificationParams, donorOrganization: undefined })
      expect(result.success).toBe(true)
    })

    it('handles missing reference number', async () => {
      const result = await sendDonationNotificationToAdmin({ ...notificationParams, referenceNumber: undefined })
      expect(result.success).toBe(true)
    })

    it('handles returning donor', async () => {
      const result = await sendDonationNotificationToAdmin({ ...notificationParams, isNewDonor: false })
      expect(result.success).toBe(true)
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email', async () => {
      const result = await sendPasswordResetEmail({ name: 'John', email: 'john@test.com', code: '123456' })

      expect(result).toEqual({ success: true, messageId: 'test-msg-id' })
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@test.com',
          subject: 'Your Hromada password reset code',
        })
      )
    })

    it('returns error on send failure', async () => {
      mockSendEmail.mockResolvedValue({ success: false, error: 'Send failed' })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendPasswordResetEmail({ name: 'John', email: 'john@test.com', code: '123456' })

      expect(result).toEqual({ success: false, error: 'Send failed' })
      consoleSpy.mockRestore()
    })
  })

  describe('sendNewsletterWelcomeEmail', () => {
    it('sends newsletter welcome email', async () => {
      const result = await sendNewsletterWelcomeEmail('sub@test.com')

      expect(result).toEqual({ success: true, messageId: 'test-msg-id' })
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'sub@test.com',
        })
      )
    })

    it('returns error on failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendNewsletterWelcomeEmail('sub@test.com')

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

      const result = await sendPartnershipInquiryNotification(partnerParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends notification with optional fields', async () => {
      const result = await sendPartnershipInquiryNotification({
        ...partnerParams,
        approximateSize: '50',
        message: 'Interested in partnering',
      })

      expect(result.success).toBe(true)
    })

    it('sends notification without optional fields', async () => {
      const result = await sendPartnershipInquiryNotification(partnerParams)
      expect(result.success).toBe(true)
    })

    it('returns error on failure', async () => {
      mockSendEmail.mockRejectedValue(new Error('Failed'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await sendPartnershipInquiryNotification(partnerParams)

      expect(result).toEqual({ success: false, error: 'Failed' })
      consoleSpy.mockRestore()
    })
  })

  describe('sendSubmissionAdminNotification', () => {
    const submissionParams = {
      facilityName: 'School #5',
      municipalityName: 'Kharkiv',
      municipalityEmail: 'kharkiv@example.com',
      region: 'Kharkiv Oblast',
      category: 'SCHOOL',
      projectType: 'SOLAR_PV',
      urgency: 'HIGH',
      briefDescription: 'Solar panels for school',
      contactName: 'Ivan',
      contactEmail: 'ivan@example.com',
      contactPhone: '+380501234567',
      photoCount: 3,
    }

    it('returns success when ADMIN_EMAIL is not configured', async () => {
      delete process.env.ADMIN_EMAIL
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await sendSubmissionAdminNotification(submissionParams)

      expect(result).toEqual({ success: true })
      consoleSpy.mockRestore()
    })

    it('sends notification with all fields', async () => {
      const result = await sendSubmissionAdminNotification(submissionParams)

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('School #5'),
        })
      )
    })
  })

  describe('sendSubmissionConfirmationEmail', () => {
    it('sends confirmation email', async () => {
      const result = await sendSubmissionConfirmationEmail('Ivan', 'ivan@example.com', 'School #5')

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'ivan@example.com',
          subject: 'Project Submission Received - Hromada',
        })
      )
    })
  })

  describe('sendSubmissionDecisionEmail', () => {
    it('sends approval email', async () => {
      const result = await sendSubmissionDecisionEmail({
        contactName: 'Ivan',
        contactEmail: 'ivan@example.com',
        facilityName: 'School #5',
        approved: true,
        projectId: 'proj-456',
      })

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your Project is Now Live - Hromada',
        })
      )
    })

    it('sends rejection email with reason', async () => {
      const result = await sendSubmissionDecisionEmail({
        contactName: 'Ivan',
        contactEmail: 'ivan@example.com',
        facilityName: 'School #5',
        approved: false,
        rejectionReason: 'Insufficient documentation',
      })

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Project Submission Update - Hromada',
        })
      )
    })
  })

  describe('sendDonationStatusEmail', () => {
    const statusParams = {
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      projectName: 'Central Hospital Solar',
      newStatus: 'RECEIVED',
    }

    it('sends RECEIVED status email', async () => {
      const result = await sendDonationStatusEmail(statusParams)

      expect(result.success).toBe(true)
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          subject: expect.stringContaining('confirmed'),
        })
      )
    })

    it('sends ALLOCATED status email', async () => {
      const result = await sendDonationStatusEmail({ ...statusParams, newStatus: 'ALLOCATED' })
      expect(result.success).toBe(true)
    })

    it('sends FORWARDED status email', async () => {
      const result = await sendDonationStatusEmail({ ...statusParams, newStatus: 'FORWARDED' })
      expect(result.success).toBe(true)
    })

    it('sends COMPLETED status email', async () => {
      const result = await sendDonationStatusEmail({ ...statusParams, newStatus: 'COMPLETED' })
      expect(result.success).toBe(true)
    })

    it('skips email for unsupported statuses', async () => {
      const result = await sendDonationStatusEmail({ ...statusParams, newStatus: 'FAILED' })

      expect(result).toEqual({ success: true })
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('skips email for PENDING_CONFIRMATION status', async () => {
      const result = await sendDonationStatusEmail({ ...statusParams, newStatus: 'PENDING_CONFIRMATION' })

      expect(result).toEqual({ success: true })
      expect(mockSendEmail).not.toHaveBeenCalled()
    })
  })
})
