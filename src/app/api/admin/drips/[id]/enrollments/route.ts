import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

// GET - View enrollments for a drip sequence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const enrollments = await prisma.dripEnrollment.findMany({
      where: { sequenceId: id },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        email: true,
        currentStep: true,
        status: true,
        nextSendAt: true,
        enrolledAt: true,
        completedAt: true,
        cancelledAt: true,
      },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('Failed to fetch enrollments:', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}
