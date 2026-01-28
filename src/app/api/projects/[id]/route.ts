import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get single project (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
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

    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.HROMADA_ADMIN_SECRET

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
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

    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const adminSecret = process.env.HROMADA_ADMIN_SECRET

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
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
