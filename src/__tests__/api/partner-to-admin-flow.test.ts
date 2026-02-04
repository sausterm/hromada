/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as partnerCreateProject, GET as partnerGetProjects } from '@/app/api/partner/projects/route'
import { GET as adminGetSubmissions } from '@/app/api/projects/submissions/route'

// Mock auth
const mockPartnerSession = {
  userId: 'partner-user-123',
  email: 'partner@testorg.com',
  role: 'PARTNER' as const,
}

jest.mock('@/lib/auth', () => ({
  verifyPartnerAuth: jest.fn(),
  verifyAdminAuth: jest.fn(),
  getSessionData: jest.fn(),
}))

// Track created submissions for the test
let createdSubmissions: Record<string, unknown>[] = []

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { verifyPartnerAuth, verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('Partner to Admin submission flow', () => {
  const validSubmission = {
    municipalityName: 'Kyiv City Council',
    municipalityEmail: 'contact@kyiv.gov.ua',
    facilityName: 'Central Hospital Solar Project',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Install solar panels on central hospital roof',
    fullDescription: 'The central hospital needs backup power. Solar panels will provide resilient energy during grid outages. The project includes 100kW of panels and battery storage.',
    cityName: 'Kyiv',
    cityLatitude: '50.4501',
    cityLongitude: '30.5234',
    contactName: 'Dr. Olena Shevchenko',
    contactEmail: 'olena@kyivhospital.org',
    contactPhone: '+380441234567',
    estimatedCostUsd: '75000',
    technicalPowerKw: '100',
    region: 'Kyiv Oblast',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    createdSubmissions = []
  })

  it('partner creates submission and admin can view it', async () => {
    // Step 1: Mock partner authentication
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockPartnerSession)

    // Mock prisma.create to store the submission
    ;(prisma.projectSubmission.create as jest.Mock).mockImplementation(async ({ data }) => {
      const submission = {
        id: 'submission-001',
        ...data,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      createdSubmissions.push(submission)
      return submission
    })

    // Step 2: Partner submits a project
    const createRequest = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const createResponse = await partnerCreateProject(createRequest)
    const createData = await createResponse.json()

    expect(createResponse.status).toBe(201)
    expect(createData.submission).toBeDefined()
    expect(createData.submission.id).toBe('submission-001')
    expect(createData.submission.facilityName).toBe('Central Hospital Solar Project')
    expect(createData.submission.submittedByUserId).toBe('partner-user-123')

    // Verify prisma.create was called with correct data
    expect(prisma.projectSubmission.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        municipalityName: 'Kyiv City Council',
        facilityName: 'Central Hospital Solar Project',
        submittedByUserId: 'partner-user-123',
        category: 'HOSPITAL',
      }),
    })

    // Step 3: Mock admin authentication
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    // Mock prisma.findMany to return all submissions (including the one just created)
    ;(prisma.projectSubmission.findMany as jest.Mock).mockResolvedValue(createdSubmissions)

    // Step 4: Admin fetches all submissions
    const adminRequest = new NextRequest('http://localhost/api/projects/submissions')
    const adminResponse = await adminGetSubmissions(adminRequest)
    const adminData = await adminResponse.json()

    expect(adminResponse.status).toBe(200)
    expect(adminData.submissions).toHaveLength(1)
    expect(adminData.submissions[0].id).toBe('submission-001')
    expect(adminData.submissions[0].facilityName).toBe('Central Hospital Solar Project')
    expect(adminData.submissions[0].submittedByUserId).toBe('partner-user-123')
    expect(adminData.submissions[0].status).toBe('PENDING')
  })

  it('partner can view only their own submissions', async () => {
    // Mock partner authentication
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(mockPartnerSession)

    // Mock database with mixed submissions
    const allSubmissions = [
      {
        id: 'sub-1',
        facilityName: 'Partner Project 1',
        submittedByUserId: 'partner-user-123',
        status: 'PENDING',
      },
      {
        id: 'sub-2',
        facilityName: 'Other Partner Project',
        submittedByUserId: 'other-partner-456',
        status: 'APPROVED',
      },
      {
        id: 'sub-3',
        facilityName: 'Partner Project 2',
        submittedByUserId: 'partner-user-123',
        status: 'APPROVED',
      },
    ]

    // findMany should filter by submittedByUserId
    ;(prisma.projectSubmission.findMany as jest.Mock).mockImplementation(async ({ where }) => {
      if (where?.submittedByUserId) {
        return allSubmissions.filter(s => s.submittedByUserId === where.submittedByUserId)
      }
      return allSubmissions
    })

    // Partner fetches their submissions
    const partnerRequest = new NextRequest('http://localhost/api/partner/projects')
    const partnerResponse = await partnerGetProjects(partnerRequest)
    const partnerData = await partnerResponse.json()

    expect(partnerResponse.status).toBe(200)
    expect(partnerData.submissions).toHaveLength(2)
    expect(partnerData.submissions.every((s: { submittedByUserId: string }) => s.submittedByUserId === 'partner-user-123')).toBe(true)
  })

  it('admin can view all submissions from all partners', async () => {
    // Mock admin authentication
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    // Mock database with submissions from multiple partners
    const allSubmissions = [
      {
        id: 'sub-1',
        facilityName: 'Hospital Solar',
        submittedByUserId: 'partner-1',
        status: 'PENDING',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'sub-2',
        facilityName: 'School Heating',
        submittedByUserId: 'partner-2',
        status: 'APPROVED',
        createdAt: new Date('2024-01-14'),
      },
      {
        id: 'sub-3',
        facilityName: 'Water Treatment',
        submittedByUserId: 'partner-1',
        status: 'REJECTED',
        createdAt: new Date('2024-01-13'),
      },
    ]

    ;(prisma.projectSubmission.findMany as jest.Mock).mockResolvedValue(allSubmissions)

    const adminRequest = new NextRequest('http://localhost/api/projects/submissions')
    const adminResponse = await adminGetSubmissions(adminRequest)
    const adminData = await adminResponse.json()

    expect(adminResponse.status).toBe(200)
    expect(adminData.submissions).toHaveLength(3)
    // Admin sees all submissions regardless of who submitted them
    expect(adminData.submissions.map((s: { submittedByUserId: string }) => s.submittedByUserId)).toEqual(['partner-1', 'partner-2', 'partner-1'])
  })

  it('unauthenticated user cannot access partner endpoint', async () => {
    ;(verifyPartnerAuth as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/partner/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission),
    })

    const response = await partnerCreateProject(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('unauthenticated user cannot access admin submissions endpoint', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions')
    const response = await adminGetSubmissions(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('partner cannot access admin-only submissions endpoint', async () => {
    // Partner is authenticated as partner, but admin check should fail
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/projects/submissions')
    const response = await adminGetSubmissions(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })
})
