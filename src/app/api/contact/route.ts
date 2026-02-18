import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/email'
import { verifyAdminAuth } from '@/lib/auth'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { parseBody, contactSchema } from '@/lib/validations'
import { detectSuspiciousInput, logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'

// GET /api/contact - List all contact submissions (admin only)
export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const unhandledOnly = searchParams.get('unhandledOnly') === 'true'

    const where: { handled?: boolean } = {}
    if (unhandledOnly) {
      where.handled = false
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            facilityName: true,
            municipalityName: true,
            contactEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching contact submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact submissions' },
      { status: 500 }
    )
  }
}

// POST /api/contact - Create new contact submission (public)
export async function POST(request: NextRequest) {
  // Rate limit: 5 submissions per minute per IP
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.contact)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const parsed = await parseBody(request, contactSchema)
  if (parsed.error) return parsed.error

  const { projectId, donorName, donorEmail, message } = parsed.data

  // Check for suspicious input in free-text fields
  if (detectSuspiciousInput(donorName) || detectSuspiciousInput(message)) {
    await logAuditEvent(AuditAction.SUSPICIOUS_ACTIVITY, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: `Suspicious input in contact form for project ${projectId}`,
    })
    return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
  }

  try {
    // Check if project exists and get details for email
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        facilityName: true,
        municipalityName: true,
        contactEmail: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        projectId,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
        message: message.trim(),
      },
    })

    // Send email notification (non-blocking - don't fail the request if email fails)
    sendContactNotification({
      donorName: donorName.trim(),
      donorEmail: donorEmail.trim().toLowerCase(),
      message: message.trim(),
      projectName: project.facilityName,
      municipalityName: project.municipalityName,
      municipalityEmail: project.contactEmail,
      projectId: project.id,
    }).catch((err) => {
      console.error('Failed to send contact notification email:', err)
    })

    return NextResponse.json({
      submission,
      municipalityEmail: project.contactEmail,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact submission:', error)
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    )
  }
}
