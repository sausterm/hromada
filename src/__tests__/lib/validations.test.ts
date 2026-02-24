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
      expect(siteAccessSchema.safeParse({ password: 'secret' }).success).toBe(true)
    })

    it('rejects empty password', () => {
      const result = siteAccessSchema.safeParse({ password: '' })
      expect(result.success).toBe(false)
    })

    it('rejects missing password', () => {
      const result = siteAccessSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: 'pass' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pass' })
      expect(result.success).toBe(false)
    })

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
      expect(result.success).toBe(false)
    })

    it('rejects password over 128 chars', () => {
      const result = loginSchema.safeParse({ email: 'user@example.com', password: 'a'.repeat(129) })
      expect(result.success).toBe(false)
    })

    it('rejects missing fields', () => {
      expect(loginSchema.safeParse({}).success).toBe(false)
      expect(loginSchema.safeParse({ email: 'user@example.com' }).success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    const valid = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    }

    it('accepts valid registration data', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true)
    })

    it('accepts with optional organization and role', () => {
      const result = registerSchema.safeParse({ ...valid, organization: 'Org', role: 'ADMIN' })
      expect(result.success).toBe(true)
    })

    it('rejects password under 12 chars', () => {
      const result = registerSchema.safeParse({ ...valid, password: 'short' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 12 characters')
      }
    })

    it('rejects invalid role', () => {
      const result = registerSchema.safeParse({ ...valid, role: 'SUPERADMIN' })
      expect(result.success).toBe(false)
    })

    it('accepts all valid roles', () => {
      for (const role of ['ADMIN', 'PARTNER', 'NONPROFIT_MANAGER']) {
        expect(registerSchema.safeParse({ ...valid, role }).success).toBe(true)
      }
    })

    it('rejects name over 255 chars', () => {
      const result = registerSchema.safeParse({ ...valid, name: 'a'.repeat(256) })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = registerSchema.safeParse({ ...valid, name: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('contactSchema', () => {
    const valid = {
      projectId: 'proj-123',
      donorName: 'Jane Doe',
      donorEmail: 'jane@example.com',
      message: 'I want to help.',
    }

    it('accepts valid contact data', () => {
      expect(contactSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects missing projectId', () => {
      const { projectId, ...rest } = valid
      expect(contactSchema.safeParse(rest).success).toBe(false)
    })

    it('rejects invalid email', () => {
      expect(contactSchema.safeParse({ ...valid, donorEmail: 'bad' }).success).toBe(false)
    })

    it('rejects message over 1000 chars', () => {
      const result = contactSchema.safeParse({ ...valid, message: 'a'.repeat(1001) })
      expect(result.success).toBe(false)
    })

    it('rejects empty message', () => {
      expect(contactSchema.safeParse({ ...valid, message: '' }).success).toBe(false)
    })
  })

  describe('newsletterSchema', () => {
    it('accepts valid email', () => {
      expect(newsletterSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(newsletterSchema.safeParse({ email: 'not-email' }).success).toBe(false)
    })

    it('rejects email over 255 chars', () => {
      const result = newsletterSchema.safeParse({ email: 'a'.repeat(250) + '@example.com' })
      expect(result.success).toBe(false)
    })
  })

  describe('partnershipInquirySchema', () => {
    const valid = {
      communityName: 'Rotary Club of Springfield',
      contactName: 'John Smith',
      contactEmail: 'john@rotary.org',
      communityType: 'rotary' as const,
    }

    it('accepts valid inquiry', () => {
      expect(partnershipInquirySchema.safeParse(valid).success).toBe(true)
    })

    it('accepts all community types', () => {
      for (const type of ['rotary', 'city_council', 'faith', 'school', 'diaspora', 'corporate', 'other']) {
        expect(partnershipInquirySchema.safeParse({ ...valid, communityType: type }).success).toBe(true)
      }
    })

    it('rejects invalid community type', () => {
      expect(partnershipInquirySchema.safeParse({ ...valid, communityType: 'unknown' }).success).toBe(false)
    })

    it('accepts optional message and approximateSize', () => {
      const result = partnershipInquirySchema.safeParse({
        ...valid,
        message: 'Interested in partnership.',
        approximateSize: '50-100 members',
      })
      expect(result.success).toBe(true)
    })

    it('rejects message over 2000 chars', () => {
      const result = partnershipInquirySchema.safeParse({ ...valid, message: 'a'.repeat(2001) })
      expect(result.success).toBe(false)
    })
  })

  describe('donationConfirmSchema', () => {
    const valid = {
      projectId: 'proj-123',
      paymentMethod: 'wire' as const,
      donorName: 'Jane Doe',
      donorEmail: 'jane@example.com',
    }

    it('accepts valid donation confirmation', () => {
      expect(donationConfirmSchema.safeParse(valid).success).toBe(true)
    })

    it('accepts all payment methods', () => {
      for (const method of ['wire', 'daf', 'check', 'ach']) {
        expect(donationConfirmSchema.safeParse({ ...valid, paymentMethod: method }).success).toBe(true)
      }
    })

    it('rejects invalid payment method', () => {
      expect(donationConfirmSchema.safeParse({ ...valid, paymentMethod: 'crypto' }).success).toBe(false)
    })

    it('accepts optional fields', () => {
      const result = donationConfirmSchema.safeParse({
        ...valid,
        projectName: 'Solar Panels',
        donorOrganization: 'Org Inc',
        amount: 5000,
        referenceNumber: 'REF-001',
        message: 'Thank you.',
      })
      expect(result.success).toBe(true)
    })

    it('accepts string or number for amount', () => {
      expect(donationConfirmSchema.safeParse({ ...valid, amount: '1000' }).success).toBe(true)
      expect(donationConfirmSchema.safeParse({ ...valid, amount: 1000 }).success).toBe(true)
    })
  })

  describe('projectSubmissionSchema', () => {
    const valid = {
      municipalityName: 'Kyiv',
      municipalityEmail: 'contact@kyiv.gov.ua',
      facilityName: 'Central Hospital',
      category: 'HOSPITAL' as const,
      projectType: 'Solar Installation',
      briefDescription: 'Install solar panels.',
      fullDescription: 'Install 50kW solar system on hospital roof.',
      cityName: 'Kyiv',
      cityLatitude: 50.4501,
      cityLongitude: 30.5234,
      contactName: 'Olena K',
      contactEmail: 'olena@kyiv.gov.ua',
    }

    it('accepts valid submission', () => {
      expect(projectSubmissionSchema.safeParse(valid).success).toBe(true)
    })

    it('accepts all categories', () => {
      for (const cat of ['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER']) {
        expect(projectSubmissionSchema.safeParse({ ...valid, category: cat }).success).toBe(true)
      }
    })

    it('rejects invalid category', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, category: 'BRIDGE' }).success).toBe(false)
    })

    it('defaults urgency to MEDIUM', () => {
      const result = projectSubmissionSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.urgency).toBe('MEDIUM')
      }
    })

    it('accepts all urgency levels', () => {
      for (const u of ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']) {
        expect(projectSubmissionSchema.safeParse({ ...valid, urgency: u }).success).toBe(true)
      }
    })

    it('rejects invalid latitude', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, cityLatitude: 91 }).success).toBe(false)
      expect(projectSubmissionSchema.safeParse({ ...valid, cityLatitude: -91 }).success).toBe(false)
    })

    it('rejects invalid longitude', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, cityLongitude: 181 }).success).toBe(false)
      expect(projectSubmissionSchema.safeParse({ ...valid, cityLongitude: -181 }).success).toBe(false)
    })

    it('accepts string coordinates', () => {
      const result = projectSubmissionSchema.safeParse({
        ...valid,
        cityLatitude: '50.45',
        cityLongitude: '30.52',
      })
      expect(result.success).toBe(true)
    })

    it('rejects non-numeric latitude string', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, cityLatitude: 'abc' }).success).toBe(false)
    })

    it('rejects briefDescription over 150 chars', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, briefDescription: 'a'.repeat(151) }).success).toBe(false)
    })

    it('rejects fullDescription over 2000 chars', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, fullDescription: 'a'.repeat(2001) }).success).toBe(false)
    })

    it('accepts optional photos array', () => {
      const result = projectSubmissionSchema.safeParse({
        ...valid,
        photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
      })
      expect(result.success).toBe(true)
    })

    it('rejects more than 5 photos', () => {
      const photos = Array.from({ length: 6 }, (_, i) => `https://example.com/photo${i}.jpg`)
      expect(projectSubmissionSchema.safeParse({ ...valid, photos }).success).toBe(false)
    })

    it('rejects invalid photo URLs', () => {
      expect(projectSubmissionSchema.safeParse({ ...valid, photos: ['not-a-url'] }).success).toBe(false)
    })
  })

  describe('parseBody', () => {
    it('returns parsed data for valid JSON', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })

      const result = await parseBody(request, newsletterSchema)
      expect(result.data).toEqual({ email: 'user@example.com' })
      expect(result.error).toBeUndefined()
    })

    it('returns 400 error for invalid data', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-email' }),
      })

      const result = await parseBody(request, newsletterSchema)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      const body = await result.error!.json()
      expect(body.error).toBeDefined()
    })

    it('returns 400 error for invalid JSON', async () => {
      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      })

      const result = await parseBody(request, newsletterSchema)
      expect(result.data).toBeUndefined()
      expect(result.error).toBeDefined()
      const body = await result.error!.json()
      expect(body.error).toBe('Invalid request body')
    })
  })
})
