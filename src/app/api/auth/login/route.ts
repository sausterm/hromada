import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  createLegacyAdminSession,
} from '@/lib/auth'
import {
  isAccountLocked,
  handleFailedLogin,
  handleSuccessfulLogin,
  logAuditEvent,
  AuditAction,
  getClientIp,
  getUserAgent,
  SECURITY_CONFIG,
} from '@/lib/security'

// POST /api/auth/login - Authenticate user and set secure cookie
export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per minute per IP (brute force protection)
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.login)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { email, password } = body

    // Support legacy password-only login for backward compatibility
    if (!email && password) {
      const adminSecret = process.env.HROMADA_ADMIN_SECRET

      if (!adminSecret) {
        return NextResponse.json(
          { error: 'Server configuration error' },
          { status: 500 }
        )
      }

      if (password !== adminSecret) {
        await logAuditEvent(AuditAction.LOGIN_FAILED, {
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          details: 'Legacy admin login failed - invalid password',
        })
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }

      // Create legacy admin session
      await createLegacyAdminSession()
      await logAuditEvent(AuditAction.LOGIN_SUCCESS, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: 'Legacy admin login',
      })
      return NextResponse.json({ success: true, role: 'ADMIN' })
    }

    // Email/password login
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First, check if this is an admin using the legacy password
    const adminSecret = process.env.HROMADA_ADMIN_SECRET
    if (adminSecret && password === adminSecret) {
      // Try to find user by email to get their role, or default to ADMIN
      const user = await getUserByEmail(email)
      if (user) {
        // Check if account is active
        if (!user.isActive) {
          await logAuditEvent(AuditAction.LOGIN_BLOCKED_INACTIVE, {
            userId: user.id,
            ipAddress: getClientIp(request),
            userAgent: getUserAgent(request),
          })
          return NextResponse.json(
            { error: 'Account is deactivated' },
            { status: 403 }
          )
        }

        await createSession(user.id, user.email, user.role, user.sessionVersion)
        await handleSuccessfulLogin(user, request)
        return NextResponse.json({
          success: true,
          role: user.role,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            organization: user.organization,
            role: user.role,
          },
        })
      } else {
        // Legacy admin login without user record
        await createLegacyAdminSession()
        await logAuditEvent(AuditAction.LOGIN_SUCCESS, {
          ipAddress: getClientIp(request),
          userAgent: getUserAgent(request),
          details: 'Legacy admin login (no user record)',
        })
        return NextResponse.json({ success: true, role: 'ADMIN' })
      }
    }

    // Look up user by email
    let user
    try {
      user = await getUserByEmail(email)
    } catch (dbError) {
      console.error('Database error looking up user:', dbError)
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      )
    }

    if (!user) {
      // Don't reveal whether email exists
      await logAuditEvent(AuditAction.LOGIN_FAILED, {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: `Login attempt for non-existent email: ${email.substring(0, 3)}***`,
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!user.isActive) {
      await logAuditEvent(AuditAction.LOGIN_BLOCKED_INACTIVE, {
        userId: user.id,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      })
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const lockRemaining = user.lockedUntil
        ? Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
        : SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES

      await logAuditEvent(AuditAction.LOGIN_BLOCKED_LOCKED, {
        userId: user.id,
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
        details: `Account locked, ${lockRemaining} minutes remaining`,
      })

      return NextResponse.json(
        {
          error: 'Account is temporarily locked due to too many failed attempts',
          lockedMinutes: lockRemaining,
        },
        { status: 423 }
      )
    }

    // Verify password
    let isValidPassword
    try {
      isValidPassword = await verifyPassword(password, user.passwordHash)
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError)
      return NextResponse.json(
        { error: 'Password verification error' },
        { status: 500 }
      )
    }

    if (!isValidPassword) {
      // Handle failed login (increment attempts, possibly lock account)
      const { locked, attemptsRemaining } = await handleFailedLogin(user, request)

      if (locked) {
        return NextResponse.json(
          {
            error: 'Account locked due to too many failed attempts',
            lockedMinutes: SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES,
          },
          { status: 423 }
        )
      }

      return NextResponse.json(
        {
          error: 'Invalid email or password',
          attemptsRemaining,
        },
        { status: 401 }
      )
    }

    // Create session with sessionVersion for revocation support
    try {
      await createSession(user.id, user.email, user.role, user.sessionVersion)
    } catch (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Session creation error' },
        { status: 500 }
      )
    }

    // Handle successful login (reset attempts, update lastLogin)
    await handleSuccessfulLogin(user, request)

    return NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
