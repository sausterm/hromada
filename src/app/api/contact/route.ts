import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/email'
import { verifyAdminAuth } from '@/lib/auth'

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
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }
    if (!body.donorName?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    if (!body.donorEmail?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.donorEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate message length
    const message = body.message.trim()
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Check if project exists and get details for email
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
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
        projectId: body.projectId,
        donorName: body.donorName.trim(),
        donorEmail: body.donorEmail.trim().toLowerCase(),
        message: message,
      },
    })

    // Send email notification (non-blocking - don't fail the request if email fails)
    sendContactNotification({
      donorName: body.donorName.trim(),
      donorEmail: body.donorEmail.trim().toLowerCase(),
      message: message,
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
