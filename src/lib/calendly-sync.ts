import { prisma } from '@/lib/prisma'
import {
  getCalendlyUser,
  getScheduledEvents,
  getEventInvitees,
} from '@/lib/calendly'
import { sendCalendlyWelcomeEmail } from '@/lib/email'

const CRON_STATE_KEY = 'calendly-sync'
const DEFAULT_LOOKBACK_DAYS = 7

export interface CalendlySyncResult {
  eventsChecked: number
  newSubscribers: number
  skipped: number
}

export async function syncCalendlyInvitees(): Promise<CalendlySyncResult> {
  // 1. Get the authenticated user's URI
  console.log('[calendly-sync] Fetching Calendly user...')
  const user = await getCalendlyUser()
  console.log(`[calendly-sync] User: ${user.name} (${user.email})`)

  // 2. Determine poll start time
  const state = await prisma.cronState.findUnique({
    where: { id: CRON_STATE_KEY },
  })

  let minStartTime: string
  if (state) {
    const parsed = JSON.parse(state.value) as { lastPoll: string }
    minStartTime = parsed.lastPoll
    console.log(`[calendly-sync] Last poll: ${minStartTime}`)
  } else {
    const lookback = new Date()
    lookback.setDate(lookback.getDate() - DEFAULT_LOOKBACK_DAYS)
    minStartTime = lookback.toISOString()
    console.log(`[calendly-sync] No previous poll, looking back ${DEFAULT_LOOKBACK_DAYS} days to ${minStartTime}`)
  }

  const pollStartedAt = new Date().toISOString()

  // 3. Fetch events since last poll
  console.log(`[calendly-sync] Fetching events since ${minStartTime}...`)
  const events = await getScheduledEvents(user.uri, minStartTime)
  console.log(`[calendly-sync] Found ${events.length} events`)

  let newSubscribers = 0
  let skipped = 0

  // 4. For each event, get invitees and upsert
  for (const event of events) {
    console.log(`[calendly-sync] Processing event: "${event.name}" (${event.startTime})`)
    const invitees = await getEventInvitees(event.uri)
    console.log(`[calendly-sync]   ${invitees.length} invitee(s)`)

    for (const invitee of invitees) {
      const email = invitee.email.toLowerCase().trim()
      if (!email) {
        console.log('[calendly-sync]   Skipping invitee with no email')
        skipped++
        continue
      }

      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email },
      })

      if (existing) {
        // Fill in name if missing, but never re-subscribe someone who was removed
        if (!existing.name && invitee.name) {
          await prisma.newsletterSubscriber.update({
            where: { email },
            data: { name: invitee.name },
          })
          console.log(`[calendly-sync]   ${email} — updated name to "${invitee.name}"`)
        } else {
          console.log(`[calendly-sync]   ${email} — already exists, skipping`)
        }
        skipped++
      } else {
        const subscriber = await prisma.newsletterSubscriber.create({
          data: {
            email,
            name: invitee.name || null,
            source: 'calendly',
          },
        })
        console.log(`[calendly-sync]   ${email} — ADDED (name: "${invitee.name}", source: calendly)`)
        newSubscribers++

        // Extract project name from custom Q&A (first answer = project interest)
        const projectName = invitee.questionsAndAnswers[0]?.answer

        // Send branded welcome email
        const emailResult = await sendCalendlyWelcomeEmail(
          email,
          invitee.name,
          subscriber.unsubscribeToken,
          projectName,
        )
        if (emailResult.success) {
          console.log(`[calendly-sync]   ${email} — welcome email sent`)
        } else {
          console.error(`[calendly-sync]   ${email} — welcome email failed: ${emailResult.error}`)
        }
      }

      // Log custom question responses
      if (invitee.questionsAndAnswers.length > 0) {
        console.log(
          `[calendly-sync]   ${email} Q&A:`,
          invitee.questionsAndAnswers.map((qa) => `${qa.question}: ${qa.answer}`).join('; ')
        )
      }
    }
  }

  // 5. Update poll timestamp
  await prisma.cronState.upsert({
    where: { id: CRON_STATE_KEY },
    update: { value: JSON.stringify({ lastPoll: pollStartedAt }) },
    create: {
      id: CRON_STATE_KEY,
      value: JSON.stringify({ lastPoll: pollStartedAt }),
    },
  })

  console.log(
    `[calendly-sync] Poll timestamp updated to ${pollStartedAt}`
  )

  return {
    eventsChecked: events.length,
    newSubscribers,
    skipped,
  }
}
