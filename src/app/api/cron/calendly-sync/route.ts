import { NextRequest, NextResponse } from 'next/server'
import { syncCalendlyInvitees } from '@/lib/calendly-sync'
import { sendEmail } from '@/lib/ses'

// POST - Sync Calendly invitees into newsletter subscriber list
// Protected by CRON_SECRET header — call via AWS EventBridge every 15 min
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
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Calendly sync failed:', error)

    // Notify admin of failure
    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      const isAuthError = message.includes('401') || message.includes('403')
      await sendEmail({
        to: adminEmail,
        subject: `[Hromada] Calendly sync failed${isAuthError ? ' — token may be expired' : ''}`,
        html: `
          <p>The Calendly polling sync failed at ${new Date().toISOString()}.</p>
          <p><strong>Error:</strong> ${message}</p>
          ${isAuthError ? '<p><strong>Action needed:</strong> The Calendly API token may be expired or revoked. Generate a new one at <a href="https://calendly.com">calendly.com</a> → Integrations → API &amp; Webhooks, then update the CALENDLY_API_TOKEN env var in Amplify.</p>' : ''}
        `,
      }).catch(() => {}) // Don't let notification failure mask the original error
    }

    return NextResponse.json(
      { error: 'Calendly sync failed' },
      { status: 500 }
    )
  }
}
