import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { sendNewsletterWelcomeEmail } from '@/lib/email'
import { parseBody, newsletterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, RATE_LIMITS.contact)
  if (rateLimitResult) return rateLimitResult

  const parsed = await parseBody(request, newsletterSchema)
  if (parsed.error) return parsed.error

  try {
    const normalized = parsed.data.email.toLowerCase().trim()

    // Check if already subscribed (don't re-send welcome email)
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalized },
    })

    // Upsert — if they unsubscribed before, re-subscribe them
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: { unsubscribed: false },
      create: { email: normalized },
    })

    // Send welcome email only for new subscribers
    if (!existing || existing.unsubscribed) {
      await sendNewsletterWelcomeEmail(normalized)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
