import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { translateProjectToUkrainian } from '@/lib/translate'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get single project (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Transform photos relation to photos string array for frontend compatibility
    const transformedProject = {
      ...project,
      photos: project.photos.map((img: { url: string }) => img.url),
    }

    const response = NextResponse.json({ project: transformedProject })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check admin auth (supports both cookie and Bearer token)
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.municipalityName && { municipalityName: body.municipalityName }),
        ...(body.facilityName && { facilityName: body.facilityName }),
        ...(body.category && { category: body.category }),
        ...(body.briefDescription && { briefDescription: body.briefDescription }),
        ...(body.fullDescription && { fullDescription: body.fullDescription }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.cityLatitude && { cityLatitude: parseFloat(body.cityLatitude) }),
        ...(body.cityLongitude && { cityLongitude: parseFloat(body.cityLongitude) }),
        ...(body.contactName && { contactName: body.contactName }),
        ...(body.contactEmail && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone || null }),
        ...(body.urgency && { urgency: body.urgency }),
        ...(body.status && { status: body.status }),
        // Technical & Financial Details (optional - allow null to clear)
        ...(body.projectType !== undefined && { projectType: body.projectType || null }),
        ...(body.projectSubtype !== undefined && { projectSubtype: body.projectSubtype || null }),
        ...(body.technicalPowerKw !== undefined && {
          technicalPowerKw: body.technicalPowerKw ? parseFloat(body.technicalPowerKw) : null,
        }),
        ...(body.numberOfPanels !== undefined && {
          numberOfPanels: body.numberOfPanels ? parseInt(body.numberOfPanels) : null,
        }),
        ...(body.estimatedCostUsd !== undefined && {
          estimatedCostUsd: body.estimatedCostUsd ? parseFloat(body.estimatedCostUsd) : null,
        }),
        ...(body.cofinancingAvailable !== undefined && {
          cofinancingAvailable: body.cofinancingAvailable || null,
        }),
        ...(body.cofinancingDetails !== undefined && {
          cofinancingDetails: body.cofinancingDetails || null,
        }),
        ...(body.partnerOrganization !== undefined && {
          partnerOrganization: body.partnerOrganization || null,
        }),
      },
    })

    // Fire-and-forget: re-translate to Ukrainian if English content changed
    const englishChanged = body.fullDescription || body.briefDescription || body.facilityName || body.municipalityName
    if (englishChanged && process.env.DEEPL_API_KEY) {
      const updated = await prisma.project.findUnique({ where: { id } })
      if (updated) {
        translateProjectToUkrainian({
          municipalityName: updated.municipalityName,
          facilityName: updated.facilityName,
          briefDescription: updated.briefDescription,
          fullDescription: updated.fullDescription,
        }).then(async (translations) => {
          if (translations.fullDescriptionUk) {
            await prisma.project.update({
              where: { id },
              data: {
                municipalityNameUk: translations.municipalityNameUk,
                facilityNameUk: translations.facilityNameUk,
                briefDescriptionUk: translations.briefDescriptionUk,
                fullDescriptionUk: translations.fullDescriptionUk,
              },
            })
            console.log(`[translate] Re-translated project ${id} to Ukrainian`)
          }
        }).catch(err => console.error('[translate] Re-translate failed:', err))
      }
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check admin auth (supports both cookie and Bearer token)
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
