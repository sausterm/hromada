import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

// PATCH - Update a drip sequence (toggle active, update name)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, active } = body

    const sequence = await prisma.dripSequence.findUnique({
      where: { id },
    })

    if (!sequence) {
      return NextResponse.json({ error: 'Sequence not found' }, { status: 404 })
    }

    const updated = await prisma.dripSequence.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    return NextResponse.json({ sequence: updated })
  } catch (error) {
    console.error('Failed to update drip sequence:', error)
    return NextResponse.json({ error: 'Failed to update drip sequence' }, { status: 500 })
  }
}
