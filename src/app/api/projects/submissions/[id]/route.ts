import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { translateProjectToUkrainian, detectLanguage } from '@/lib/translate'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// GET - Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check for admin authorization
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'admin'}`).toString('base64')}`

  if (authHeader !== expectedAuth) {
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

  // Check for admin authorization
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'admin'}`).toString('base64')}`

  if (authHeader !== expectedAuth) {
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
          reviewedBy: reviewedBy || 'admin',
          approvedProjectId: project.id,
        },
      })

      // Send approval email
      if (resend) {
        try {
          await resend.emails.send({
            from: 'Hromada <noreply@hromada.org>',
            to: submission.contactEmail,
            subject: 'Your Project is Now Live - Hromada',
            html: `
              <h2>Great News!</h2>
              <p>Dear ${submission.contactName},</p>

              <p>Your project <strong>${submission.facilityName}</strong> has been approved and is now live on the Hromada platform!</p>

              <p>Potential donors can now see your project and express interest in supporting it.</p>

              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/projects/${project.id}">View Your Project</a></p>

              <p>We encourage you to share this link with your network to increase visibility.</p>

              <p>Thank you for working to rebuild Ukraine's communities.</p>

              <p>Best regards,<br>The Hromada Team</p>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError)
        }
      }

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
          reviewedBy: reviewedBy || 'admin',
          rejectionReason: rejectionReason.trim(),
        },
      })

      // Send rejection email
      if (resend) {
        try {
          await resend.emails.send({
            from: 'Hromada <noreply@hromada.org>',
            to: submission.contactEmail,
            subject: 'Project Submission Update - Hromada',
            html: `
              <h2>Project Submission Update</h2>
              <p>Dear ${submission.contactName},</p>

              <p>Thank you for submitting your project <strong>${submission.facilityName}</strong> to Hromada.</p>

              <p>After review, we were unable to approve your submission at this time for the following reason:</p>

              <blockquote style="padding: 10px 20px; background: #f5f5f5; border-left: 3px solid #ccc; margin: 20px 0;">
                ${rejectionReason}
              </blockquote>

              <p>You are welcome to address these concerns and submit a new application. If you have questions, please contact us at support@hromada.org</p>

              <p>Best regards,<br>The Hromada Team</p>
            `,
          })
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError)
        }
      }

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

  // Check for admin authorization
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'admin'}`).toString('base64')}`

  if (authHeader !== expectedAuth) {
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
