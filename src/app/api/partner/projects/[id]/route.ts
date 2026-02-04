import { NextRequest, NextResponse } from 'next/server'
import { verifyPartnerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/partner/projects/[id] - Get a single submission owned by the partner
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const submission = await prisma.projectSubmission.findFirst({
      where: {
        id,
        submittedByUserId: session.userId,
      },
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

// PATCH /api/partner/projects/[id] - Update a pending submission owned by the partner
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if submission exists and belongs to user
    const existingSubmission = await prisma.projectSubmission.findFirst({
      where: {
        id,
        submittedByUserId: session.userId,
      },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Only allow editing pending submissions
    if (existingSubmission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending submissions can be edited' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Build update data from allowed fields
    const allowedFields = [
      'municipalityName',
      'municipalityEmail',
      'region',
      'facilityName',
      'category',
      'projectType',
      'briefDescription',
      'fullDescription',
      'urgency',
      'estimatedCostUsd',
      'technicalPowerKw',
      'numberOfPanels',
      'cofinancingAvailable',
      'cofinancingDetails',
      'cityName',
      'address',
      'cityLatitude',
      'cityLongitude',
      'contactName',
      'contactEmail',
      'contactPhone',
      'partnerOrganization',
      'projectSubtype',
      'additionalNotes',
      'photos',
    ]

    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'briefDescription') {
          updateData[field] = body[field].substring(0, 150)
        } else if (field === 'fullDescription') {
          updateData[field] = body[field].substring(0, 2000)
        } else if (field === 'additionalNotes') {
          updateData[field] = body[field]?.substring(0, 1000) || null
        } else if (field === 'estimatedCostUsd' || field === 'technicalPowerKw') {
          updateData[field] = body[field] ? parseFloat(body[field]) : null
        } else if (field === 'numberOfPanels') {
          updateData[field] = body[field] ? parseInt(body[field], 10) : null
        } else if (field === 'cityLatitude' || field === 'cityLongitude') {
          updateData[field] = parseFloat(body[field])
        } else if (field === 'municipalityEmail' || field === 'contactEmail') {
          updateData[field] = body[field].toLowerCase()
        } else {
          updateData[field] = body[field]
        }
      }
    }

    const submission = await prisma.projectSubmission.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Failed to update submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}
