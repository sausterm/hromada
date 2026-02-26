import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { translateProjectToUkrainian, detectLanguage } from '@/lib/translate'
import { verifyAdminAuth } from '@/lib/auth'
import { sendProjectApprovalEmail, sendProjectRejectionEmail } from '@/lib/email'

// GET - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check for admin authorization (supports both cookie and Bearer token)
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 })
  }
}

// PATCH - Update submission (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check for admin authorization (supports both cookie and Bearer token)
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { action, rejectionReason, reviewedBy } = data

    const submission = await prisma.projectSubmission.findUnique({
      where: { id },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission has already been processed' }, { status: 400 })
    }

    if (action === 'approve') {
      // Auto-translate content to Ukrainian
      let ukrainianTranslations = {
        municipalityNameUk: null as string | null,
        facilityNameUk: null as string | null,
        briefDescriptionUk: null as string | null,
        fullDescriptionUk: null as string | null,
      }

      // Only translate if content appears to be in English
      const contentLanguage = detectLanguage(submission.fullDescription)
      if (contentLanguage === 'en' || contentLanguage === 'unknown') {
        console.log('[approve] Translating project content to Ukrainian...')
        try {
          ukrainianTranslations = await translateProjectToUkrainian({
            municipalityName: submission.municipalityName,
            facilityName: submission.facilityName,
            briefDescription: submission.briefDescription,
            fullDescription: submission.fullDescription,
          })
          console.log('[approve] Translation completed successfully')
        } catch (translationError) {
          console.error('[approve] Translation failed, continuing without translations:', translationError)
        }
      } else {
        console.log('[approve] Content appears to be in Ukrainian, skipping translation')
      }

      // Create a new Project from the submission
      const project = await prisma.project.create({
        data: {
          municipalityName: submission.municipalityName,
          facilityName: submission.facilityName,
          category: submission.category,
          briefDescription: submission.briefDescription,
          fullDescription: submission.fullDescription,
          cityLatitude: Number(submission.cityLatitude),
          cityLongitude: Number(submission.cityLongitude),
          address: submission.address,
          contactName: submission.contactName,
          contactEmail: submission.contactEmail,
          contactPhone: submission.contactPhone,
          urgency: submission.urgency,
          status: 'OPEN',
          projectType: submission.projectType as any || null,
          projectSubtype: submission.projectSubtype,
          technicalPowerKw: submission.technicalPowerKw,
          numberOfPanels: submission.numberOfPanels,
          estimatedCostUsd: submission.estimatedCostUsd,
          cofinancingAvailable: submission.cofinancingAvailable as any || null,
          cofinancingDetails: submission.cofinancingDetails,
          partnerOrganization: submission.partnerOrganization,
          edrpou: submission.edrpou,
          // Ukrainian translations
          municipalityNameUk: ukrainianTranslations.municipalityNameUk,
          facilityNameUk: ukrainianTranslations.facilityNameUk,
          briefDescriptionUk: ukrainianTranslations.briefDescriptionUk,
          fullDescriptionUk: ukrainianTranslations.fullDescriptionUk,
        },
      })

      // Update submission status
      await prisma.projectSubmission.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: reviewedBy || 'unknown',
          approvedProjectId: project.id,
        },
      })

      // Send branded approval email
      await sendProjectApprovalEmail({
        contactName: submission.contactName,
        contactEmail: submission.contactEmail,
        facilityName: submission.facilityName,
        projectId: project.id,
      }).catch((e) => console.error('Failed to send approval email:', e))

      return NextResponse.json({
        success: true,
        projectId: project.id,
        message: 'Project approved and published',
      })
    } else if (action === 'reject') {
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
      }

      // Update submission status
      await prisma.projectSubmission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: reviewedBy || 'unknown',
          rejectionReason: rejectionReason.trim(),
        },
      })

      // Send branded rejection email
      await sendProjectRejectionEmail({
        contactName: submission.contactName,
        contactEmail: submission.contactEmail,
        facilityName: submission.facilityName,
        rejectionReason: rejectionReason.trim(),
      }).catch((e) => console.error('Failed to send rejection email:', e))

      return NextResponse.json({
        success: true,
        message: 'Submission rejected',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Failed to process submission:', error)
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 })
  }
}

// DELETE - Delete submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check for admin authorization (supports both cookie and Bearer token)
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.projectSubmission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete submission:', error)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}
