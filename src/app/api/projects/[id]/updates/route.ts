import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const createUpdateSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['MANUAL', 'PHOTO_ADDED']),
  photoUrl: z.string().url().optional(),
})

// POST /api/projects/[id]/updates — Create a manual project update
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: projectId } = await params

    const session = await verifyAuth(request)
    if (!session?.userId || !session.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['ADMIN', 'PARTNER', 'NONPROFIT_MANAGER']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify the project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Partners must own this project via a submission
    if (session.role === 'PARTNER' || session.role === 'NONPROFIT_MANAGER') {
      const submission = await prisma.projectSubmission.findFirst({
        where: {
          submittedByUserId: session.userId,
          approvedProjectId: projectId,
        },
      })
      if (!submission) {
        return NextResponse.json({ error: 'You do not have access to this project' }, { status: 403 })
      }
    }

    // Parse and validate body
    const body = await request.json()
    const parsed = createUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { title, message, type, photoUrl } = parsed.data

    // Look up user for author info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, organization: true, role: true },
    })

    const isPartnerRole = user?.role === 'PARTNER' || user?.role === 'NONPROFIT_MANAGER'
    const createdByName = isPartnerRole && user?.organization ? user.organization : user?.name ?? 'Unknown'
    const createdByRole = user?.role === 'ADMIN' ? 'Admin' : 'Partner'

    const update = await prisma.projectUpdate.create({
      data: {
        projectId,
        type,
        title,
        message,
        metadata: photoUrl ? { photoUrl } : undefined,
        isPublic: true,
        createdById: session.userId,
        createdByName,
        createdByRole,
      },
    })

    return NextResponse.json({ update }, { status: 201 })
  } catch (error) {
    console.error('Error creating project update:', error)
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}
