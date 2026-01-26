import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/inquiries/[id] - Get single inquiry (admin only)
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Error fetching inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    )
  }
}

// PATCH /api/inquiries/[id] - Mark inquiry as read (admin only)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        ...(body.read !== undefined && { read: body.read }),
      },
    })

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Error updating inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to update inquiry' },
      { status: 500 }
    )
  }
}

// DELETE /api/inquiries/[id] - Delete inquiry (admin only)
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

    await prisma.inquiry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    )
  }
}
