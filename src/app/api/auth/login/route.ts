import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  createLegacyAdminSession,
} from '@/lib/auth'

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
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }

      // Create legacy admin session
      await createLegacyAdminSession()
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
        await createSession(user.id, user.email, user.role)
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
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
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
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    try {
      await createSession(user.id, user.email, user.role)
    } catch (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { error: 'Session creation error' },
        { status: 500 }
      )
    }

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
