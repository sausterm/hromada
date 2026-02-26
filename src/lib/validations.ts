import { z } from 'zod'
import { NextResponse } from 'next/server'

// Shared field schemas
const emailField = z.string().email('Invalid email format').max(255)
const passwordField = z.string().min(12, 'Password must be at least 12 characters').max(128)
const nameField = z.string().min(1, 'Name is required').max(255)
const messageField = z.string().min(1, 'Message is required').max(2000)

// --- Auth schemas ---

export const siteAccessSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
})

export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  name: nameField,
  organization: z.string().max(255).optional(),
  role: z.enum(['ADMIN', 'PARTNER', 'NONPROFIT_MANAGER']).optional(),
})

// --- Public form schemas ---

export const contactSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  donorName: nameField,
  donorEmail: emailField,
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be 1000 characters or less'),
})

export const newsletterSchema = z.object({
  email: emailField,
})

export const partnershipInquirySchema = z.object({
  communityName: z.string().min(1, 'Community name is required').max(255),
  contactName: nameField,
  contactEmail: emailField,
  communityType: z.enum(['rotary', 'city_council', 'faith', 'school', 'diaspora', 'corporate', 'other']),
  approximateSize: z.string().max(100).optional(),
  message: z.string().max(2000, 'Message must be 2000 characters or less').optional(),
})

export const donationConfirmSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  projectName: z.string().max(255).optional(),
  paymentMethod: z.enum(['wire', 'daf', 'check', 'ach']),
  donorName: nameField,
  donorEmail: emailField,
  donorOrganization: z.string().max(255).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  referenceNumber: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
})

export const projectSubmissionSchema = z.object({
  municipalityName: z.string().min(1, 'Municipality name is required').max(255),
  municipalityEmail: emailField,
  region: z.string().max(255).optional(),
  facilityName: z.string().min(1, 'Facility name is required').max(255),
  category: z.enum(['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER'], { message: 'Invalid category' }),
  projectType: z.string().min(1, 'Project type is required'),
  briefDescription: z.string().min(1, 'Brief description is required').max(150, 'Brief description must be 150 characters or less'),
  fullDescription: z.string().min(1, 'Full description is required').max(2000, 'Full description must be 2000 characters or less'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  estimatedCostUsd: z.union([z.string(), z.number()]).optional(),
  technicalPowerKw: z.union([z.string(), z.number()]).optional(),
  numberOfPanels: z.union([z.string(), z.number()]).optional(),
  cofinancingAvailable: z.string().max(255).optional().nullable(),
  cofinancingDetails: z.string().max(1000).optional().nullable(),
  cityName: z.string().min(1, 'City name is required').max(255),
  address: z.string().max(500).optional().nullable(),
  cityLatitude: z.union([z.string(), z.number()]).refine((v) => {
    const n = Number(v)
    return !isNaN(n) && n >= -90 && n <= 90
  }, 'Invalid latitude'),
  cityLongitude: z.union([z.string(), z.number()]).refine((v) => {
    const n = Number(v)
    return !isNaN(n) && n >= -180 && n <= 180
  }, 'Invalid longitude'),
  contactName: nameField,
  contactEmail: emailField,
  contactPhone: z.string().max(50).optional().nullable(),
  partnerOrganization: z.string().max(255).optional().nullable(),
  projectSubtype: z.string().max(255).optional().nullable(),
  additionalNotes: z.string().max(1000).optional().nullable(),
  photos: z.array(z.string().url()).max(5).optional(),
  edrpou: z.string().regex(/^\d{8}$/, 'EDRPOU must be exactly 8 digits').optional(),
  submittedByUserId: z.string().optional(),
})

// --- Campaign schemas ---

export const campaignCreateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255),
  htmlContent: z.string().min(1, 'HTML content is required'),
})

export const campaignUpdateSchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  htmlContent: z.string().min(1).optional(),
})

// --- Drip sequence schemas ---

export const dripSequenceCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  trigger: z.enum([
    'NEW_DONOR',
    'NEW_SUBSCRIBER',
    'DONATION_COMPLETED',
    'INACTIVE_30',
    'INACTIVE_90',
  ]),
  active: z.boolean().optional(),
  steps: z.array(
    z.object({
      delayDays: z.number().int().min(0),
      subject: z.string().min(1).max(255),
      htmlContent: z.string().min(1),
    })
  ).min(1, 'At least one step is required'),
})

/**
 * Parse and validate a request body against a Zod schema.
 * Returns either the parsed data or a 400 error Response.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.issues[0]
      return {
        error: NextResponse.json(
          { error: firstError.message },
          { status: 400 }
        ),
      }
    }

    return { data: result.data }
  } catch {
    return {
      error: NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      ),
    }
  }
}
