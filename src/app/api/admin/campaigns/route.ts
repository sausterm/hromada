import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { parseBody } from '@/lib/validations'
import { campaignCreateSchema } from '@/lib/validations'

// GET - List all campaigns
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        scheduledAt: true,
        sentAt: true,
        completedAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

// POST - Create a new draft campaign
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = await parseBody(request, campaignCreateSchema)
  if (parsed.error) return parsed.error

  try {
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject: parsed.data.subject,
        htmlContent: parsed.data.htmlContent,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
