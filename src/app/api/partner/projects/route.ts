import { NextRequest, NextResponse } from 'next/server'
import { verifyPartnerAuth, getSessionData } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Category, Urgency } from '@prisma/client'

// GET /api/partner/projects - List partner's own project submissions
export async function GET(request: NextRequest) {
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const submissions = await prisma.projectSubmission.findMany({
      where: { submittedByUserId: session.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Failed to fetch partner submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST /api/partner/projects - Create a new project submission
export async function POST(request: NextRequest) {
  const session = await verifyPartnerAuth(request)
  if (!session || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      'municipalityName',
      'municipalityEmail',
      'facilityName',
      'category',
      'projectType',
      'briefDescription',
      'fullDescription',
      'cityName',
      'cityLatitude',
      'cityLongitude',
      'contactName',
      'contactEmail',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.municipalityEmail)) {
      return NextResponse.json(
        { error: 'Invalid municipality email format' },
        { status: 400 }
      )
    }
    if (!emailRegex.test(body.contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid contact email format' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories: Category[] = ['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    // Validate urgency if provided
    const validUrgencies: Urgency[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    const urgency: Urgency = body.urgency && validUrgencies.includes(body.urgency) ? body.urgency : 'MEDIUM'

    // Parse numeric fields
    const cityLatitude = parseFloat(body.cityLatitude)
    const cityLongitude = parseFloat(body.cityLongitude)

    if (isNaN(cityLatitude) || cityLatitude < -90 || cityLatitude > 90) {
      return NextResponse.json(
        { error: 'Invalid city latitude' },
        { status: 400 }
      )
    }
    if (isNaN(cityLongitude) || cityLongitude < -180 || cityLongitude > 180) {
      return NextResponse.json(
        { error: 'Invalid city longitude' },
        { status: 400 }
      )
    }

    // Create submission
    const submission = await prisma.projectSubmission.create({
      data: {
        municipalityName: body.municipalityName,
        municipalityEmail: body.municipalityEmail.toLowerCase(),
        region: body.region || null,
        facilityName: body.facilityName,
        category: body.category,
        projectType: body.projectType,
        briefDescription: body.briefDescription.substring(0, 150),
        fullDescription: body.fullDescription.substring(0, 2000),
        urgency,
        estimatedCostUsd: body.estimatedCostUsd ? parseFloat(body.estimatedCostUsd) : null,
        technicalPowerKw: body.technicalPowerKw ? parseFloat(body.technicalPowerKw) : null,
        numberOfPanels: body.numberOfPanels ? parseInt(body.numberOfPanels, 10) : null,
        cofinancingAvailable: body.cofinancingAvailable || null,
        cofinancingDetails: body.cofinancingDetails || null,
        cityName: body.cityName,
        address: body.address || null,
        cityLatitude,
        cityLongitude,
        contactName: body.contactName,
        contactEmail: body.contactEmail.toLowerCase(),
        contactPhone: body.contactPhone || null,
        partnerOrganization: body.partnerOrganization || null,
        projectSubtype: body.projectSubtype || null,
        additionalNotes: body.additionalNotes?.substring(0, 1000) || null,
        photos: body.photos || [],
        submittedByUserId: session.userId,
      },
    })

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error) {
    console.error('Failed to create submission:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
