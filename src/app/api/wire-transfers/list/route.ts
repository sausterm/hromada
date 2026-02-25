import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionData, validateSessionWithDatabase } from '@/lib/auth'

// GET /api/wire-transfers/list — list all wire transfers (admin/nonprofit manager only)
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
    const wireTransfers = await prisma.wireTransfer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
        recipientName: true,
        projectName: true,
        amountUsd: true,
        status: true,
        sentAt: true,
        confirmedAt: true,
        createdAt: true,
      },
    })

    const serialized = wireTransfers.map(w => ({
      ...w,
      amount: Number(w.amountUsd),
      amountUsd: undefined,
    }))

    return NextResponse.json({ wireTransfers: serialized })
  } catch (error) {
    console.error('Failed to fetch wire transfers:', error)
    return NextResponse.json({ error: 'Failed to fetch wire transfers' }, { status: 500 })
  }
}
