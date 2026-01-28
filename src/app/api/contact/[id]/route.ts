import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

// PATCH /api/contact/[id] - Update contact submission (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Only allow updating 'handled' field
    if (typeof body.handled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: handled must be a boolean' },
        { status: 400 }
      )
    }

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: { handled: body.handled },
      include: {
        project: {
          select: {
            id: true,
            facilityName: true,
            municipalityName: true,
          },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error updating contact submission:', error)

    // Check for not found error
    if ((error as any)?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Contact submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update contact submission' },
      { status: 500 }
    )
  }
}
