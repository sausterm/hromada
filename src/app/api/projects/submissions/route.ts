import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { parseBody, projectSubmissionSchema } from '@/lib/validations'
import { sanitizeInput, detectSuspiciousInput, logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'

const ses = process.env.AWS_SES_REGION
  ? new SESClient({ region: process.env.AWS_SES_REGION })
  : null
const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || 'noreply@hromadaproject.org'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

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

    // Send email notification to admin — sanitize all user-provided values
    if (ses && ADMIN_EMAIL) {
      try {
        await ses.send(
          new SendEmailCommand({
            Source: `Hromada <${FROM_EMAIL}>`,
            Destination: { ToAddresses: [ADMIN_EMAIL] },
            Message: {
              Subject: { Data: `New Project Submission: ${sanitizeInput(data.facilityName)}`, Charset: 'UTF-8' },
              Body: {
                Html: {
                  Charset: 'UTF-8',
                  Data: `
            <h2>New Project Submission</h2>
            <p>A new project has been submitted for review.</p>

            <h3>Municipality Information</h3>
            <ul>
              <li><strong>Municipality:</strong> ${sanitizeInput(data.municipalityName)}</li>
              <li><strong>Email:</strong> ${sanitizeInput(data.municipalityEmail)}</li>
              ${data.region ? `<li><strong>Region:</strong> ${sanitizeInput(data.region)}</li>` : ''}
            </ul>

            <h3>Project Details</h3>
            <ul>
              <li><strong>Facility:</strong> ${sanitizeInput(data.facilityName)}</li>
              <li><strong>Category:</strong> ${sanitizeInput(data.category)}</li>
              <li><strong>Type:</strong> ${sanitizeInput(data.projectType)}</li>
              <li><strong>Urgency:</strong> ${sanitizeInput(data.urgency || 'MEDIUM')}</li>
            </ul>

            <h3>Brief Description</h3>
            <p>${sanitizeInput(data.briefDescription)}</p>

            ${data.photos && data.photos.length > 0 ? `
            <h3>Photos</h3>
            <p>${data.photos.length} photo(s) uploaded</p>
            ` : ''}

            <h3>Contact Information</h3>
            <ul>
              <li><strong>Name:</strong> ${sanitizeInput(data.contactName)}</li>
              <li><strong>Email:</strong> ${sanitizeInput(data.contactEmail)}</li>
              ${data.contactPhone ? `<li><strong>Phone:</strong> ${sanitizeInput(data.contactPhone)}</li>` : ''}
            </ul>

            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin">Review in Admin Dashboard</a></p>
          `,
                },
              },
            },
          })
        )
      } catch (emailError) {
        console.error('Failed to send admin notification email:', emailError)
      }
    }

    // Send confirmation email to submitter
    if (ses) {
      try {
        await ses.send(
          new SendEmailCommand({
            Source: `Hromada <${FROM_EMAIL}>`,
            Destination: { ToAddresses: [data.contactEmail.trim().toLowerCase()] },
            Message: {
              Subject: { Data: 'Project Submission Received - Hromada', Charset: 'UTF-8' },
              Body: {
                Html: {
                  Charset: 'UTF-8',
                  Data: `
            <h2>Thank You for Your Submission</h2>
            <p>Dear ${sanitizeInput(data.contactName)},</p>

            <p>We have received your project submission for <strong>${sanitizeInput(data.facilityName)}</strong>.</p>

            <h3>What Happens Next?</h3>
            <ul>
              <li>Our team will review your submission within 3-5 business days.</li>
              <li>We may contact you if we need additional information.</li>
              <li>Once approved, your project will be visible to potential donors on our platform.</li>
            </ul>

            <p>If you have any questions, please contact us at support@hromada.org</p>

            <p>Thank you for working to rebuild Ukraine's communities.</p>

            <p>Best regards,<br>The Hromada Team</p>
          `,
                },
              },
            },
          })
        )
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }
    }

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
