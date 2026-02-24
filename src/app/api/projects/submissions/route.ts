import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { parseBody, projectSubmissionSchema } from '@/lib/validations'
import { detectSuspiciousInput, logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'
import { sendSubmissionAdminNotification, sendSubmissionConfirmationEmail } from '@/lib/email'

// GET - List all submissions (admin only)
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submissions = await prisma.projectSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST - Create new submission (public)
export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.projectSubmission)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const parsed = await parseBody(request, projectSubmissionSchema)
  if (parsed.error) return parsed.error

  const data = parsed.data

  // Check for suspicious input in free-text fields
  const freeText = [
    data.facilityName, data.briefDescription, data.fullDescription,
    data.additionalNotes, data.contactName, data.partnerOrganization,
  ].filter(Boolean).join(' ')
  if (detectSuspiciousInput(freeText)) {
    await logAuditEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: 'Suspicious input in project submission form',
    })
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
  }

  try {
    const lat = parseFloat(String(data.cityLatitude))
    const lng = parseFloat(String(data.cityLongitude))

    // Create submission
    const submission = await prisma.projectSubmission.create({
      data: {
        municipalityName: data.municipalityName.trim(),
        municipalityEmail: data.municipalityEmail.trim().toLowerCase(),
        region: data.region?.trim() || null,
        facilityName: data.facilityName.trim(),
        category: data.category,
        projectType: data.projectType,
        briefDescription: data.briefDescription.trim(),
        fullDescription: data.fullDescription.trim(),
        urgency: data.urgency || 'MEDIUM',
        estimatedCostUsd: data.estimatedCostUsd ? parseFloat(String(data.estimatedCostUsd)) : null,
        technicalPowerKw: data.technicalPowerKw ? parseFloat(String(data.technicalPowerKw)) : null,
        numberOfPanels: data.numberOfPanels ? parseInt(String(data.numberOfPanels)) : null,
        cofinancingAvailable: data.cofinancingAvailable || null,
        cofinancingDetails: data.cofinancingDetails?.trim() || null,
        cityName: data.cityName.trim(),
        address: data.address?.trim() || null,
        cityLatitude: lat,
        cityLongitude: lng,
        contactName: data.contactName.trim(),
        contactEmail: data.contactEmail.trim().toLowerCase(),
        contactPhone: data.contactPhone?.trim() || null,
        partnerOrganization: data.partnerOrganization?.trim() || null,
        projectSubtype: data.projectSubtype?.trim() || null,
        additionalNotes: data.additionalNotes?.trim() || null,
        photos: Array.isArray(data.photos) ? data.photos.slice(0, 5) : [],
      },
    })

    // Send email notifications (non-blocking)
    sendSubmissionAdminNotification({
      facilityName: data.facilityName,
      municipalityName: data.municipalityName,
      municipalityEmail: data.municipalityEmail,
      region: data.region,
      category: data.category,
      projectType: data.projectType,
      urgency: data.urgency || 'MEDIUM',
      briefDescription: data.briefDescription,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      photoCount: data.photos?.length || 0,
    }).catch((err) => console.error('Failed to send admin notification email:', err))

    sendSubmissionConfirmationEmail(
      data.contactName,
      data.contactEmail.trim().toLowerCase(),
      data.facilityName,
    ).catch((err) => console.error('Failed to send confirmation email:', err))

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Project submitted successfully',
    })
  } catch (error) {
    console.error('Failed to create submission:', error)
    return NextResponse.json({ error: 'Failed to submit project' }, { status: 500 })
  }
}
