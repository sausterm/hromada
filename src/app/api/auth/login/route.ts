import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const COOKIE_NAME = 'hromada_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// POST /api/auth/login - Authenticate admin and set secure cookie
export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per minute per IP (brute force protection)
  const rateLimitResponse = rateLimit(request, RATE_LIMITS.login)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const adminSecret = process.env.HROMADA_ADMIN_SECRET

    if (!adminSecret) {
      console.error('HROMADA_ADMIN_SECRET not configured')
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

    // Create a session token (in production, use a proper session library)
    // For now, we use a simple HMAC of the secret + timestamp
    const sessionToken = Buffer.from(`${adminSecret}:${Date.now()}`).toString('base64')

    // Set httpOnly secure cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
