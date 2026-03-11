import { NextRequest, NextResponse } from 'next/server'
import { verifyPartnerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendProjectSubmissionNotification, sendProjectSubmissionConfirmation } from '@/lib/email'
import type { Urgency, Category } from '@prisma/client'

interface BulkProjectRow {
  municipalityName: string
  municipalityEmail?: string
  region?: string
  facilityName: string
  category: string
  projectType: string
  briefDescription: string
  fullDescription: string
  urgency?: string
  estimatedCostUsd?: number
  technicalPowerKw?: number
  numberOfPanels?: number
  cofinancingAvailable?: string
  cofinancingDetails?: string
  cityName: string
  cityLatitude: number
  cityLongitude: number
  contactName: string
  contactEmail: string
  partnerOrganization?: string
  edrpou?: string
  additionalNotes?: string
}

const VALID_CATEGORIES: string[] = ['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER']
const VALID_URGENCIES: string[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const MAX_ROWS = 50

// POST /api/partner/projects/bulk - Create multiple project submissions at once
export async function POST(request: NextRequest) {
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { projects: BulkProjectRow[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { projects } = body
  if (!Array.isArray(projects) || projects.length === 0) {
    return NextResponse.json({ error: 'No projects provided' }, { status: 400 })
  }

  if (projects.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_ROWS} projects per upload` },
      { status: 400 }
    )
  }

  // Look up partner info for confirmation emails
  const partnerUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, name: true },
  })

  const results: { row: number; success: boolean; id?: string; facilityName: string; error?: string }[] = []

  // Process each row individually (not a transaction — partial success is acceptable)
  for (let i = 0; i < projects.length; i++) {
    const row = projects[i]
    try {
      // Validate required fields
      if (!row.municipalityName || !row.facilityName || !row.briefDescription ||
          !row.fullDescription || !row.cityName || !row.contactName || !row.contactEmail) {
        results.push({ row: i, success: false, facilityName: row.facilityName || `Row ${i + 1}`, error: 'Missing required fields' })
        continue
      }

      if (!VALID_CATEGORIES.includes(row.category as Category)) {
        results.push({ row: i, success: false, facilityName: row.facilityName, error: `Invalid category: ${row.category}` })
        continue
      }

      const lat = parseFloat(String(row.cityLatitude))
      const lng = parseFloat(String(row.cityLongitude))
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        results.push({ row: i, success: false, facilityName: row.facilityName, error: 'Invalid coordinates' })
        continue
      }

      const urgency: Urgency = VALID_URGENCIES.includes(row.urgency || '')
        ? (row.urgency as Urgency)
        : 'MEDIUM'

      const submission = await prisma.projectSubmission.create({
        data: {
          municipalityName: row.municipalityName,
          municipalityEmail: (row.municipalityEmail || row.contactEmail).toLowerCase(),
          region: row.region || null,
          facilityName: row.facilityName,
          category: row.category as Category,
          projectType: row.projectType || 'GENERAL',
          briefDescription: row.briefDescription.substring(0, 150),
          fullDescription: row.fullDescription.substring(0, 2000),
          urgency,
          estimatedCostUsd: row.estimatedCostUsd ? parseFloat(String(row.estimatedCostUsd)) : null,
          technicalPowerKw: row.technicalPowerKw ? parseFloat(String(row.technicalPowerKw)) : null,
          numberOfPanels: row.numberOfPanels ? parseInt(String(row.numberOfPanels), 10) : null,
          cofinancingAvailable: row.cofinancingAvailable || null,
          cofinancingDetails: row.cofinancingDetails || null,
          cityName: row.cityName,
          address: null,
          cityLatitude: lat,
          cityLongitude: lng,
          contactName: row.contactName,
          contactEmail: row.contactEmail.toLowerCase(),
          contactPhone: null,
          partnerOrganization: row.partnerOrganization || null,
          projectSubtype: null,
          additionalNotes: row.additionalNotes?.substring(0, 1000) || null,
          photos: [],
          documents: [],
          submittedByUserId: session.userId,
        },
      })

      results.push({ row: i, success: true, id: submission.id, facilityName: row.facilityName })

      // Send email notifications (fire-and-forget per row, don't block other rows)
      sendProjectSubmissionNotification({
        facilityName: row.facilityName,
        municipalityName: row.municipalityName,
        municipalityEmail: row.municipalityEmail || row.contactEmail,
        region: row.region || undefined,
        category: row.category,
        projectType: row.projectType || 'GENERAL',
        briefDescription: row.briefDescription,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        photoCount: 0,
        edrpou: row.edrpou || undefined,
      }).catch((e) => console.error(`Failed to send admin notification for row ${i}:`, e))

    } catch (error) {
      console.error(`Failed to create submission for row ${i}:`, error)
      results.push({
        row: i,
        success: false,
        facilityName: row.facilityName || `Row ${i + 1}`,
        error: 'Failed to create submission',
      })
    }
  }

  // Send one confirmation email to the partner for the entire batch
  const successCount = results.filter(r => r.success).length
  if (successCount > 0 && partnerUser?.email) {
    await sendProjectSubmissionConfirmation({
      contactName: partnerUser.name || 'Partner',
      contactEmail: partnerUser.email,
      facilityName: `${successCount} project${successCount > 1 ? 's' : ''} (bulk upload)`,
    }).catch((e) => console.error('Failed to send bulk confirmation:', e))
  }

  return NextResponse.json({
    total: projects.length,
    succeeded: successCount,
    failed: projects.length - successCount,
    results,
  }, { status: successCount > 0 ? 201 : 400 })
}
