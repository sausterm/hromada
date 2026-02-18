import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserByEmail } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logAuditEvent, AuditAction, getClientIp, getUserAgent } from '@/lib/security'

function generateOTP(): string {
  const array = new Uint8Array(4)
  crypto.getRandomValues(array)
  const num = ((array[0] << 16) | (array[1] << 8) | array[2]) % 1000000
  return num.toString().padStart(6, '0')
}

export async function POST(request: NextRequest) {
  // Rate limit: 3 per hour
  const rateLimitResponse = rateLimit(request, {
    limit: 3,
    windowSeconds: 3600,
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await getUserByEmail(email.trim())

    // Always return success to avoid revealing whether the email exists
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true })
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    // Generate OTP and store it
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    })

    // Send email
    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      code,
    })

    await logAuditEvent(AuditAction.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
