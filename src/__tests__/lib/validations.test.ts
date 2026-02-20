/**
 * @jest-environment node
 */

import {
  siteAccessSchema,
  loginSchema,
  registerSchema,
  contactSchema,
  newsletterSchema,
  partnershipInquirySchema,
  donationConfirmSchema,
  projectSubmissionSchema,
  parseBody,
} from '@/lib/validations'

describe('validations', () => {
  describe('siteAccessSchema', () => {
    it('accepts valid password', () => {
      expect(siteAccessSchema.safeParse({ password: 'test123' }).success).toBe(true)
    })

    it('rejects empty password', () => {
      expect(siteAccessSchema.safeParse({ password: '' }).success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('accepts valid credentials', () => {
      expect(loginSchema.safeParse({ email: 'test@test.com', password: 'pass' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(loginSchema.safeParse({ email: 'not-email', password: 'pass' }).success).toBe(false)
    })

    it('rejects empty password', () => {
      expect(loginSchema.safeParse({ email: 'test@test.com', password: '' }).success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('accepts valid registration', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'a-long-password-12',
        name: 'Test User',
      })
      expect(result.success).toBe(true)
    })

    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'short',
        name: 'Test',
      })
      expect(result.success).toBe(false)
    })

    it('accepts optional organization', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'a-long-password-12',
        name: 'Test User',
        organization: 'Test Org',
      })
      expect(result.success).toBe(true)
    })

    it('accepts optional role', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'a-long-password-12',
        name: 'Test User',
        role: 'ADMIN',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid role', () => {
      const result = registerSchema.safeParse({
        email: 'test@test.com',
        password: 'a-long-password-12',
        name: 'Test User',
        role: 'INVALID',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('contactSchema', () => {
    it('accepts valid contact', () => {
      const result = contactSchema.safeParse({
        projectId: 'p1',
        donorName: 'John',
        donorEmail: 'john@test.com',
        message: 'Hello',
      })
      expect(result.success).toBe(true)
    })

    it('rejects message over 1000 chars', () => {
      const result = contactSchema.safeParse({
        projectId: 'p1',
        donorName: 'John',
        donorEmail: 'john@test.com',
        message: 'a'.repeat(1001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('newsletterSchema', () => {
    it('accepts valid email', () => {
      expect(newsletterSchema.safeParse({ email: 'test@test.com' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(newsletterSchema.safeParse({ email: 'bad' }).success).toBe(false)
    })
  })

  describe('partnershipInquirySchema', () => {
    it('accepts valid inquiry', () => {
      const result = partnershipInquirySchema.safeParse({
        communityName: 'Test Community',
        contactName: 'John',
        contactEmail: 'john@test.com',
        communityType: 'rotary',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid community type', () => {
      const result = partnershipInquirySchema.safeParse({
        communityName: 'Test',
        contactName: 'John',
        contactEmail: 'john@test.com',
        communityType: 'invalid_type',
      })
      expect(result.success).toBe(false)
    })

    it('accepts optional fields', () => {
      const result = partnershipInquirySchema.safeParse({
        communityName: 'Test',
        contactName: 'John',
        contactEmail: 'john@test.com',
        communityType: 'city_council',
        approximateSize: '100',
        message: 'Details here',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('donationConfirmSchema', () => {
    it('accepts valid donation', () => {
      const result = donationConfirmSchema.safeParse({
        projectId: 'p1',
        paymentMethod: 'wire',
        donorName: 'John',
        donorEmail: 'john@test.com',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid payment method', () => {
      const result = donationConfirmSchema.safeParse({
        projectId: 'p1',
        paymentMethod: 'bitcoin',
        donorName: 'John',
        donorEmail: 'john@test.com',
      })
      expect(result.success).toBe(false)
    })

    it('accepts all valid payment methods', () => {
      for (const method of ['wire', 'daf', 'check', 'ach']) {
        const result = donationConfirmSchema.safeParse({
          projectId: 'p1',
          paymentMethod: method,
          donorName: 'John',
          donorEmail: 'john@test.com',
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('projectSubmissionSchema', () => {
    const validSubmission = {
      municipalityName: 'Kyiv',
      municipalityEmail: 'mayor@kyiv.ua',
      facilityName: 'School #1',
      category: 'SCHOOL',
      projectType: 'solar',
      briefDescription: 'Install solar panels',
      fullDescription: 'Full description of the project',
      cityName: 'Kyiv',
      cityLatitude: '50.45',
      cityLongitude: '30.52',
      contactName: 'Ivan',
      contactEmail: 'ivan@test.com',
    }

    it('accepts valid submission', () => {
      expect(projectSubmissionSchema.safeParse(validSubmission).success).toBe(true)
    })

    it('rejects invalid category', () => {
      const result = projectSubmissionSchema.safeParse({
        ...validSubmission,
        category: 'INVALID',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid latitude', () => {
      const result = projectSubmissionSchema.safeParse({
        ...validSubmission,
        cityLatitude: '200',
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid longitude', () => {
      const result = projectSubmissionSchema.safeParse({
        ...validSubmission,
        cityLongitude: '999',
      })
      expect(result.success).toBe(false)
    })

    it('rejects brief description over 150 chars', () => {
      const result = projectSubmissionSchema.safeParse({
        ...validSubmission,
        briefDescription: 'a'.repeat(151),
      })
      expect(result.success).toBe(false)
    })

    it('accepts numeric latitude/longitude', () => {
      const result = projectSubmissionSchema.safeParse({
        ...validSubmission,
        cityLatitude: 50.45,
        cityLongitude: 30.52,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('parseBody', () => {
    it('parses valid JSON body', async () => {
      const body = JSON.stringify({ email: 'test@test.com' })
      const request = new Request('http://localhost', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await parseBody(request, newsletterSchema)

      expect(result.data).toEqual({ email: 'test@test.com' })
      expect(result.error).toBeUndefined()
    })

    it('returns error for invalid data', async () => {
      const body = JSON.stringify({ email: 'bad' })
      const request = new Request('http://localhost', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await parseBody(request, newsletterSchema)

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      expect(result.error!.status).toBe(400)
    })

    it('returns error for invalid JSON', async () => {
      const request = new Request('http://localhost', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await parseBody(request, newsletterSchema)

      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
    })
  })
})
