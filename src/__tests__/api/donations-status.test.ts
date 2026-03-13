/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { PATCH } from '@/app/api/donations/[id]/status/route'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    donation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  getSessionData: jest.fn(),
  validateSessionWithDatabase: jest.fn(),
}))

// Mock security
jest.mock('@/lib/security', () => ({
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

// Mock audit
jest.mock('@/lib/audit', () => ({
  logTransactionEvent: jest.fn().mockResolvedValue(undefined),
  TransactionAction: {
    DONATION_FORWARDED: 'DONATION_FORWARDED',
    DONATION_STATUS_CHANGED: 'DONATION_STATUS_CHANGED',
  },
}))

// Mock tax-receipt
jest.mock('@/lib/tax-receipt', () => ({
  generateTaxReceipt: jest.fn().mockResolvedValue(Buffer.from('fake-pdf')),
  generateReceiptNumber: jest.fn().mockReturnValue('REC-TEST-001'),
}))

// Mock email
jest.mock('@/lib/email', () => ({
  sendDonationForwardedEmail: jest.fn().mockResolvedValue(undefined),
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

import { prisma } from '@/lib/prisma'
import { getSessionData, validateSessionWithDatabase } from '@/lib/auth'
import { logTransactionEvent } from '@/lib/audit'
import { sendDonationForwardedEmail } from '@/lib/email'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const createParams = (id: string) => ({ params: Promise.resolve({ id }) })

const mockAdminSession = { userId: 'admin-1', role: 'ADMIN' }
const mockDonation = {
  id: 'don-1',
  status: 'PENDING_CONFIRMATION',
  amount: 5000,
  paymentMethod: 'wire',
  referenceNumber: 'HRO-2026-0001',
  donorName: 'Jane Donor',
  donorEmail: 'jane@example.com',
  donorOrganization: null,
  projectName: 'Horenka Hospital',
  projectId: 'proj-1',
}

describe('PATCH /api/donations/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when no session', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(401)
  })

  it('returns 401 for non-admin/non-nonprofit role', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue({ userId: 'u1', role: 'DONOR' })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(401)
  })

  it('returns 401 when session is invalid in database', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: false })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid request body')
  })

  it('returns 400 when status is missing', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Status is required')
  })

  it('returns 404 when donation not found', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(404)
  })

  it('returns 400 for invalid status transition', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Cannot transition from PENDING_CONFIRMATION to COMPLETED')
  })

  it('successfully transitions PENDING_CONFIRMATION to RECEIVED', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)

    const updatedDonation = {
      ...mockDonation,
      status: 'RECEIVED',
      receivedAt: new Date(),
      forwardedAt: null,
      taxReceiptUrl: null,
      donorUser: null,
    }
    ;(mockPrisma.donation.update as jest.Mock).mockResolvedValue(updatedDonation)

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.donation.status).toBe('RECEIVED')
    expect(logTransactionEvent).toHaveBeenCalled()
  })

  it('includes internalNotes in update when provided', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)
    ;(mockPrisma.donation.update as jest.Mock).mockResolvedValue({
      ...mockDonation,
      status: 'RECEIVED',
      receivedAt: new Date(),
      forwardedAt: null,
      taxReceiptUrl: null,
      donorUser: null,
    })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED', internalNotes: 'Wire confirmed' }),
    })

    await PATCH(request, createParams('don-1'))

    expect(mockPrisma.donation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          internalNotes: 'Wire confirmed',
        }),
      })
    )
  })

  it('generates receipt and sends email on FORWARDED transition', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })

    const receivedDonation = { ...mockDonation, status: 'RECEIVED' }
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(receivedDonation)

    const forwardedDonation = {
      ...receivedDonation,
      status: 'FORWARDED',
      receivedAt: new Date(),
      forwardedAt: new Date(),
      taxReceiptUrl: null,
      donorUser: null,
    }
    ;(mockPrisma.donation.update as jest.Mock).mockResolvedValue(forwardedDonation)
    ;(mockPrisma.project.findUnique as jest.Mock).mockResolvedValue({
      photos: [{ url: 'https://example.com/photo.jpg' }],
      municipalityName: 'Horenka',
      partnerOrganization: 'NGO Ecoaction',
    })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FORWARDED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(sendDonationForwardedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        donorName: 'Jane Donor',
        donorEmail: 'jane@example.com',
        projectName: 'Horenka Hospital',
      })
    )
  })

  it('allows NONPROFIT_MANAGER role', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue({ userId: 'nm-1', role: 'NONPROFIT_MANAGER' })
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)
    ;(mockPrisma.donation.update as jest.Mock).mockResolvedValue({
      ...mockDonation,
      status: 'RECEIVED',
      receivedAt: new Date(),
      forwardedAt: null,
      taxReceiptUrl: null,
      donorUser: null,
    })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(200)
  })

  it('returns 500 on database error', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)
    ;(mockPrisma.donation.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RECEIVED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to update donation status')

    consoleSpy.mockRestore()
  })

  it('rejects transitions from terminal states', async () => {
    ;(getSessionData as jest.Mock).mockResolvedValue(mockAdminSession)
    ;(validateSessionWithDatabase as jest.Mock).mockResolvedValue({ valid: true })
    ;(mockPrisma.donation.findUnique as jest.Mock).mockResolvedValue({
      ...mockDonation,
      status: 'COMPLETED',
    })

    const request = new NextRequest('http://localhost/api/donations/don-1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'FORWARDED' }),
    })

    const response = await PATCH(request, createParams('don-1'))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Cannot transition from COMPLETED to FORWARDED')
  })
})
