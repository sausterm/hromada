import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionData, validateSessionWithDatabase } from '@/lib/auth'

// GET /api/donations/list — list all donations (admin/nonprofit manager only)
export async function GET(request: NextRequest) {
  const session = await getSessionData()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'NONPROFIT_MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { valid } = await validateSessionWithDatabase(session)
  if (!valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectName: true,
        projectId: true,
        donorName: true,
        donorEmail: true,
        donorOrganization: true,
        amount: true,
        paymentMethod: true,
        referenceNumber: true,
        status: true,
        submittedAt: true,
        receivedAt: true,
        forwardedAt: true,
        taxReceiptUrl: true,
      },
    })

    // Convert Decimal to number for JSON serialization
    const serialized = donations.map(d => ({
      ...d,
      amount: d.amount ? Number(d.amount) : null,
    }))

    return NextResponse.json({ donations: serialized })
  } catch (error) {
    console.error('Failed to fetch donations:', error)
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 })
  }
}
