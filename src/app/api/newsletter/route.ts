import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { sendNewsletterWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const rateLimitResult = rateLimit(request, RATE_LIMITS.contact)
  if (rateLimitResult) return rateLimitResult

  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const normalized = email.toLowerCase().trim()

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
