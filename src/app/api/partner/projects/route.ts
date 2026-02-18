import { NextRequest, NextResponse } from 'next/server'
import { verifyPartnerAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseBody, projectSubmissionSchema } from '@/lib/validations'
import type { Urgency } from '@prisma/client'

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

  const parsed = await parseBody(request, projectSubmissionSchema)
  if (parsed.error) return parsed.error

  try {
    const body = parsed.data

    const cityLatitude = parseFloat(String(body.cityLatitude))
    const cityLongitude = parseFloat(String(body.cityLongitude))
    const urgency: Urgency = (body.urgency as Urgency) || 'MEDIUM'

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
        estimatedCostUsd: body.estimatedCostUsd ? parseFloat(String(body.estimatedCostUsd)) : null,
        technicalPowerKw: body.technicalPowerKw ? parseFloat(String(body.technicalPowerKw)) : null,
        numberOfPanels: body.numberOfPanels ? parseInt(String(body.numberOfPanels), 10) : null,
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
