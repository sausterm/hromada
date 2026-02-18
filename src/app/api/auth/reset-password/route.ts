import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserByEmail, hashPassword } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import {
  validatePasswordStrength,
  logAuditEvent,
  AuditAction,
  getClientIp,
  getUserAgent,
  revokeAllSessions,
} from '@/lib/security'

export async function POST(request: NextRequest) {
  // Rate limit: 3 per hour
  const rateLimitResponse = rateLimit(request, {
    limit: 3,
    windowSeconds: 3600,
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { email, code, newPassword } = body

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(email.trim())
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    // Find a valid, unused token
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    })

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordCheck.errors },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(newPassword)

    // Update password, mark token used, revoke sessions — all in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
    ])

    await logAuditEvent(AuditAction.PASSWORD_RESET_COMPLETED, {
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
