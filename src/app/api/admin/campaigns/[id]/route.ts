import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { parseBody } from '@/lib/validations'
import { campaignUpdateSchema } from '@/lib/validations'

// GET - Campaign detail with send stats
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
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        sends: {
          select: { id: true, recipientEmail: true, status: true, sentAt: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

// PATCH - Edit a draft campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await parseBody(request, campaignUpdateSchema)
  if (parsed.error) return parsed.error

  try {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft campaigns can be edited' },
        { status: 400 }
      )
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(parsed.data.subject && { subject: parsed.data.subject }),
        ...(parsed.data.htmlContent && { htmlContent: parsed.data.htmlContent }),
      },
    })

    return NextResponse.json({ campaign: updated })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}
