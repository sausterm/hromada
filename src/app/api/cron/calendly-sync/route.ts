import { NextRequest, NextResponse } from 'next/server'
import { syncCalendlyInvitees } from '@/lib/calendly-sync'
import { sendEmail } from '@/lib/ses'
import { emailLayout, emailHeading } from '@/lib/email-template'

// POST - Sync Calendly invitees into newsletter subscriber list
// Protected by CRON_SECRET header — call via AWS EventBridge at :00/:15/:30/:45
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  console.log(`[calendly-sync] === SYNC STARTED at ${timestamp} ===`)

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[calendly-sync] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[calendly-sync] Unauthorized request received')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[calendly-sync] Auth passed')

  // Gracefully skip if Calendly isn't set up yet
  if (!process.env.CALENDLY_API_TOKEN) {
    console.warn('[calendly-sync] CALENDLY_API_TOKEN not configured, skipping')
    return NextResponse.json({
      success: true,
      message: 'CALENDLY_API_TOKEN not configured, skipping sync',
    })
  }

  console.log('[calendly-sync] Token present, starting sync...')

  try {
    const result = await syncCalendlyInvitees()
    const duration = Date.now() - startTime

    console.log(
      `[calendly-sync] === SYNC COMPLETE in ${duration}ms === ` +
      `events=${result.eventsChecked} new=${result.newSubscribers} skipped=${result.skipped}`
    )

    return NextResponse.json({
      success: true,
      ...result,
      durationMs: duration,
      timestamp,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const duration = Date.now() - startTime

    console.error(`[calendly-sync] === SYNC FAILED in ${duration}ms === Error: ${message}`)

    // Notify admin of failure
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const isAuthError = message.includes('401') || message.includes('403')
      const alertBody = `
        ${emailHeading('Calendly Sync Failed')}
        <p>The Calendly polling sync failed at ${timestamp}.</p>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Duration:</strong> ${duration}ms</p>
        ${isAuthError ? '<p><strong>Action needed:</strong> The Calendly API token may be expired or revoked. Generate a new one at <a href="https://calendly.com">calendly.com</a> &rarr; Integrations &rarr; API &amp; Webhooks, then update the CALENDLY_API_TOKEN env var in Amplify.</p>' : ''}
      `
      await sendEmail({
        to: adminEmail,
        subject: `[Hromada] Calendly sync failed${isAuthError ? ' \u2014 token may be expired' : ''}`,
        html: emailLayout(alertBody),
      }).catch(() => {})
    }

    return NextResponse.json(
      { error: 'Calendly sync failed' },
      { status: 500 }
    )
  }
}
