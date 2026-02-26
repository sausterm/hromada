import { NextRequest, NextResponse } from 'next/server'
import { discoverTenders, pollLinkedTenders } from '@/lib/prozorro-sync'
import { sendEmail } from '@/lib/ses'
import { emailLayout, emailHeading } from '@/lib/email-template'

// POST - Daily Prozorro sync: discover new tenders + poll linked tenders
// Protected by CRON_SECRET header — call via AWS EventBridge daily
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  console.log(`[prozorro-sync] === SYNC STARTED at ${timestamp} ===`)

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[prozorro-sync] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[prozorro-sync] Unauthorized request received')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Phase 1: Discover new tenders for funded projects
    const discovery = await discoverTenders()

    // Phase 2: Poll existing linked tenders for status changes
    const polling = await pollLinkedTenders()

    const duration = Date.now() - startTime

    console.log(
      `[prozorro-sync] === SYNC COMPLETE in ${duration}ms === ` +
      `matches=${discovery.matchesFound} polled=${polling.tendersPolled} ` +
      `changes=${polling.statusChanges} errors=${discovery.errors.length + polling.errors.length}`
    )

    return NextResponse.json({
      success: true,
      discovery,
      polling,
      durationMs: duration,
      timestamp,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const duration = Date.now() - startTime

    console.error(`[prozorro-sync] === SYNC FAILED in ${duration}ms === Error: ${message}`)

    // Notify admin of failure
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const alertBody = `
        ${emailHeading('Prozorro Sync Failed')}
        <p>The Prozorro procurement sync failed at ${timestamp}.</p>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Duration:</strong> ${duration}ms</p>
      `
      await sendEmail({
        to: adminEmail,
        subject: '[Hromada] Prozorro sync failed',
        html: emailLayout(alertBody),
      }).catch(() => {})
    }

    return NextResponse.json(
      { error: 'Prozorro sync failed' },
      { status: 500 }
    )
  }
}
