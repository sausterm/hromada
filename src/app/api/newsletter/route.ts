import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limit: 3 requests per minute per IP
  const rateLimitResult = rateLimit(request, RATE_LIMITS.contact)
  if (rateLimitResult) return rateLimitResult

  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Send notification to admin
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'hromada <updates@hromadaproject.org>',
      to: process.env.ADMIN_EMAIL || 'admin@hromadaproject.org',
      subject: `Newsletter signup: ${email}`,
      text: `New newsletter signup:\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
