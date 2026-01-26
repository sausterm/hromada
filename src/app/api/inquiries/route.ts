import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inquiries - List all inquiries (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.HROMADA_ADMIN_SECRET

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where: any = {}

    if (projectId) {
      where.projectId = projectId
    }
    if (unreadOnly) {
      where.read = false
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            facilityName: true,
            municipalityName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ inquiries })
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}

// POST /api/inquiries - Create new inquiry (public)
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
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    if (!body.email?.trim()) {
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
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        projectId: body.projectId,
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        organization: body.organization?.trim() || null,
        message: body.message.trim(),
      },
    })

    // TODO: Send email notification to admin and municipality contact
    // This would integrate with an email service like SendGrid, AWS SES, etc.

    return NextResponse.json({ inquiry }, { status: 201 })
  } catch (error) {
    console.error('Error creating inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    )
  }
}
