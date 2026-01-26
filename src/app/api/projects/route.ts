import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects - List all projects (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const urgency = searchParams.get('urgency')

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

    const projects = await prisma.project.findMany({
      where,
      orderBy: [
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ projects })
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

    // Validate required fields
    const required = [
      'municipalityName',
      'facilityName',
      'category',
      'description',
      'address',
      'latitude',
      'longitude',
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

    const project = await prisma.project.create({
      data: {
        municipalityName: body.municipalityName,
        facilityName: body.facilityName,
        category: body.category,
        description: body.description,
        address: body.address,
        latitude: parseFloat(body.latitude),
        longitude: parseFloat(body.longitude),
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone || null,
        urgency: body.urgency || 'MEDIUM',
        status: body.status || 'OPEN',
        photos: body.photos || [],
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
