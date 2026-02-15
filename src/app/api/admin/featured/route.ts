import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const featured = await prisma.featuredProject.findMany({
    orderBy: { slot: 'asc' },
    include: {
      project: {
        select: { id: true, facilityName: true, municipalityName: true, category: true },
      },
    },
  })

  return NextResponse.json({ featured })
}

export async function PUT(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { slots } = await request.json()

    if (!Array.isArray(slots) || slots.length > 4) {
      return NextResponse.json({ error: 'slots must be an array of 0-4 entries' }, { status: 400 })
    }

    const seenSlots = new Set<number>()
    const seenProjects = new Set<string>()

    for (const entry of slots) {
      if (!entry.slot || !entry.projectId) {
        return NextResponse.json({ error: 'Each entry needs slot and projectId' }, { status: 400 })
      }
      if (entry.slot < 1 || entry.slot > 4) {
        return NextResponse.json({ error: 'Slot must be 1-4' }, { status: 400 })
      }
      if (seenSlots.has(entry.slot)) {
        return NextResponse.json({ error: `Duplicate slot: ${entry.slot}` }, { status: 400 })
      }
      if (seenProjects.has(entry.projectId)) {
        return NextResponse.json({ error: 'Same project in multiple slots' }, { status: 400 })
      }
      seenSlots.add(entry.slot)
      seenProjects.add(entry.projectId)
    }

    // Verify all referenced projects exist
    const projectIds = slots.map((s: { projectId: string }) => s.projectId)
    if (projectIds.length > 0) {
      const count = await prisma.project.count({ where: { id: { in: projectIds } } })
      if (count !== projectIds.length) {
        return NextResponse.json({ error: 'One or more projects not found' }, { status: 400 })
      }
    }

    // Atomic replace: delete all, then insert new set
    await prisma.$transaction([
      prisma.featuredProject.deleteMany(),
      ...slots.map((entry: { slot: number; projectId: string }) =>
        prisma.featuredProject.create({
          data: { slot: entry.slot, projectId: entry.projectId },
        })
      ),
    ])

    const featured = await prisma.featuredProject.findMany({
      orderBy: { slot: 'asc' },
      include: {
        project: {
          select: { id: true, facilityName: true, municipalityName: true, category: true },
        },
      },
    })

    return NextResponse.json({ featured })
  } catch (error) {
    console.error('Error updating featured projects:', error)
    return NextResponse.json({ error: 'Failed to update featured projects' }, { status: 500 })
  }
}
