import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

// GET /api/donor/donations - Get authenticated donor's donations with project updates
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth(request)
    if (!session || (session.role !== 'DONOR' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const donations = await prisma.donation.findMany({
      where: { donorEmail: session.email },
      orderBy: { submittedAt: 'desc' },
      include: {
        updates: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // For each donation with a projectId, fetch public project updates
    const projectIds = [...new Set(donations.map(d => d.projectId).filter(Boolean))] as string[]

    const projectUpdates = projectIds.length > 0
      ? await prisma.projectUpdate.findMany({
          where: {
            projectId: { in: projectIds },
            isPublic: true,
          },
          orderBy: { createdAt: 'desc' },
        })
      : []

    // Group project updates by projectId
    const updatesByProject = new Map<string, typeof projectUpdates>()
    for (const update of projectUpdates) {
      const existing = updatesByProject.get(update.projectId) ?? []
      existing.push(update)
      updatesByProject.set(update.projectId, existing)
    }

    const result = donations.map(d => ({
      id: d.id,
      projectId: d.projectId,
      projectName: d.projectName,
      amount: d.amount ? Number(d.amount) : null,
      paymentMethod: d.paymentMethod,
      status: d.status,
      submittedAt: d.submittedAt.toISOString(),
      receivedAt: d.receivedAt?.toISOString() ?? null,
      // Combine donation-level updates and project-level updates
      updates: [
        ...d.updates.map(u => ({
          id: u.id,
          title: u.title,
          message: u.message,
          createdAt: u.createdAt.toISOString(),
          source: 'donation' as const,
        })),
        ...(d.projectId && updatesByProject.has(d.projectId)
          ? updatesByProject.get(d.projectId)!.map(u => ({
              id: u.id,
              title: u.title,
              message: u.message,
              createdAt: u.createdAt.toISOString(),
              metadata: u.metadata as Record<string, unknown> | null,
              source: 'project' as const,
            }))
          : []),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }))

    return NextResponse.json({ donations: result })
  } catch (error) {
    console.error('Error fetching donor donations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}
