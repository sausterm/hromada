import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

// Default page size
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// GET /api/projects - List projects with optional pagination (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')
    const projectType = searchParams.get('projectType')

    // Pagination params
    const cursor = searchParams.get('cursor') // cursor-based pagination
    const limitParam = searchParams.get('limit')
    const allParam = searchParams.get('all') // ?all=true returns all (for map)

    const limit = Math.min(
      parseInt(limitParam || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    )

    const where: any = {}

    if (category) {
      where.category = category
    }
    if (status) {
      where.status = status
    }
    if (urgency) {
      where.urgency = urgency
    }
    if (projectType) {
      where.projectType = projectType
    }

    // If ?all=true, return all projects with summary fields only (for map + card list)
    // Full details (fullDescription, contact info, etc.) are fetched per-project via GET /api/projects/[id]
    if (allParam === 'true') {
      const projects = await prisma.project.findMany({
        where,
        select: {
          id: true,
          municipalityName: true,
          facilityName: true,
          category: true,
          briefDescription: true,
          address: true,
          cityLatitude: true,
          cityLongitude: true,
          urgency: true,
          status: true,
          region: true,
          projectType: true,
          technicalPowerKw: true,
          estimatedCostUsd: true,
          cofinancingAvailable: true,
          createdAt: true,
          updatedAt: true,
          // Ukrainian translations
          municipalityNameUk: true,
          facilityNameUk: true,
          briefDescriptionUk: true,
          photos: {
            select: { url: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
        orderBy: [
          { urgency: 'desc' },
          { createdAt: 'desc' },
        ],
      })
      // Transform photos relation to photos string array for frontend compatibility
      const transformedProjects = projects.map((project) => ({
        ...project,
        photos: project.photos.map((img) => img.url),
      }))
      return NextResponse.json({ projects: transformedProjects, total: projects.length })
    }

    // Get total count for pagination info
    const total = await prisma.project.count({ where })

    // Cursor-based pagination for better performance
    const projects = await prisma.project.findMany({
      where,
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      take: limit + 1, // Take one extra to check if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor item
      }),
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Check if there are more results
    const hasMore = projects.length > limit
    const items = hasMore ? projects.slice(0, -1) : projects
    const nextCursor = hasMore ? items[items.length - 1]?.id : null

    // Transform photos relation to photos string array for frontend compatibility
    const transformedItems = items.map((project: { photos: { url: string }[] } & Record<string, unknown>) => ({
      ...project,
      photos: project.photos.map((img: { url: string }) => img.url),
    }))

    return NextResponse.json({
      projects: transformedItems,
      pagination: {
        total,
        limit,
        hasMore,
        nextCursor,
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin auth (supports both cookie and Bearer token)
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const required = [
      'municipalityName',
      'facilityName',
      'category',
      'briefDescription',
      'fullDescription',
      'cityLatitude',
      'cityLongitude',
      'contactName',
      'contactEmail',
    ]

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate field lengths
    if (body.briefDescription.length > 150) {
      return NextResponse.json(
        { error: 'briefDescription must be 150 characters or less' },
        { status: 400 }
      )
    }
    if (body.fullDescription.length > 2000) {
      return NextResponse.json(
        { error: 'fullDescription must be 2000 characters or less' },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        municipalityName: body.municipalityName,
        facilityName: body.facilityName,
        category: body.category,
        briefDescription: body.briefDescription,
        fullDescription: body.fullDescription,
        address: body.address || null,
        cityLatitude: parseFloat(body.cityLatitude),
        cityLongitude: parseFloat(body.cityLongitude),
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone || null,
        urgency: body.urgency || 'MEDIUM',
        status: body.status || 'OPEN',
        // Technical & Financial Details (optional)
        projectType: body.projectType || null,
        projectSubtype: body.projectSubtype || null,
        technicalPowerKw: body.technicalPowerKw ? parseFloat(body.technicalPowerKw) : null,
        numberOfPanels: body.numberOfPanels ? parseInt(body.numberOfPanels) : null,
        estimatedCostUsd: body.estimatedCostUsd ? parseFloat(body.estimatedCostUsd) : null,
        cofinancingAvailable: body.cofinancingAvailable || null,
        cofinancingDetails: body.cofinancingDetails || null,
        partnerOrganization: body.partnerOrganization || null,
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
