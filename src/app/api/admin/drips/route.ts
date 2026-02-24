import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { parseBody, dripSequenceCreateSchema } from '@/lib/validations'

// GET - List all drip sequences
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sequences = await prisma.dripSequence.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json({ sequences })
  } catch (error) {
    console.error('Failed to fetch drip sequences:', error)
    return NextResponse.json({ error: 'Failed to fetch drip sequences' }, { status: 500 })
  }
}

// POST - Create a new drip sequence with steps
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await parseBody(request, dripSequenceCreateSchema)
  if (parsed.error) return parsed.error

  try {
    const sequence = await prisma.dripSequence.create({
      data: {
        name: parsed.data.name,
        trigger: parsed.data.trigger,
        active: parsed.data.active ?? true,
        steps: {
          create: parsed.data.steps.map((step, idx) => ({
            stepOrder: idx + 1,
            delayDays: step.delayDays,
            subject: step.subject,
            htmlContent: step.htmlContent,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    return NextResponse.json({ sequence }, { status: 201 })
  } catch (error) {
    console.error('Failed to create drip sequence:', error)
    return NextResponse.json({ error: 'Failed to create drip sequence' }, { status: 500 })
  }
}
