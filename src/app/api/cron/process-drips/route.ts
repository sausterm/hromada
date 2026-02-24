import { NextRequest, NextResponse } from 'next/server'
import { processDueSteps } from '@/lib/drip'

// POST - Process due drip sequence steps
// Protected by CRON_SECRET header — called hourly via AWS EventBridge
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

  try {
    const result = await processDueSteps()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Failed to process drip steps:', error)
    return NextResponse.json({ error: 'Failed to process drip steps' }, { status: 500 })
  }
}
