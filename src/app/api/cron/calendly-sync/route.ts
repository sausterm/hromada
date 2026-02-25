import { NextRequest, NextResponse } from 'next/server'
import { syncCalendlyInvitees } from '@/lib/calendly-sync'

// POST - Sync Calendly invitees into newsletter subscriber list
// Protected by CRON_SECRET header — call via AWS EventBridge or cron-job.org
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Gracefully skip if Calendly isn't set up yet
  if (!process.env.CALENDLY_API_TOKEN) {
    return NextResponse.json({
      success: true,
      message: 'CALENDLY_API_TOKEN not configured, skipping sync',
    })
  }

  try {
    const result = await syncCalendlyInvitees()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Calendly sync failed:', error)
    return NextResponse.json(
      { error: 'Calendly sync failed' },
      { status: 500 }
    )
  }
}
