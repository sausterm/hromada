import { prisma } from '@/lib/prisma'
import {
  getCalendlyUser,
  getScheduledEvents,
  getEventInvitees,
} from '@/lib/calendly'

const CRON_STATE_KEY = 'calendly-sync'
const DEFAULT_LOOKBACK_DAYS = 7

export interface CalendlySyncResult {
  eventsChecked: number
  newSubscribers: number
  skipped: number
}

export async function syncCalendlyInvitees(): Promise<CalendlySyncResult> {
  // 1. Get the authenticated user's URI
  const user = await getCalendlyUser()

  // 2. Determine poll start time
  const state = await prisma.cronState.findUnique({
    where: { id: CRON_STATE_KEY },
  })

  let minStartTime: string
  if (state) {
    const parsed = JSON.parse(state.value) as { lastPoll: string }
    minStartTime = parsed.lastPoll
  } else {
    const lookback = new Date()
    lookback.setDate(lookback.getDate() - DEFAULT_LOOKBACK_DAYS)
    minStartTime = lookback.toISOString()
  }

  const pollStartedAt = new Date().toISOString()

  // 3. Fetch events since last poll
  const events = await getScheduledEvents(user.uri, minStartTime)

  let newSubscribers = 0
  let skipped = 0

  // 4. For each event, get invitees and upsert
  for (const event of events) {
    const invitees = await getEventInvitees(event.uri)

    for (const invitee of invitees) {
      const email = invitee.email.toLowerCase().trim()
      if (!email) {
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
        }
        skipped++
      } else {
        await prisma.newsletterSubscriber.create({
          data: {
            email,
            name: invitee.name || null,
            source: 'calendly',
          },
        })
        newSubscribers++
      }

      // Log custom question responses for visibility
      if (invitee.questionsAndAnswers.length > 0) {
        console.log(
          `[calendly-sync] ${email} Q&A:`,
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
    `[calendly-sync] Done: ${events.length} events, ${newSubscribers} new, ${skipped} skipped`
  )

  return {
    eventsChecked: events.length,
    newSubscribers,
    skipped,
  }
}
