import { NextRequest, NextResponse } from 'next/server'

const SITE_PASSWORD = 'hromada!2026'
const COOKIE_NAME = 'hromada_site_access'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

// POST /api/auth/site-access - Verify site password and set cookie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password !== SITE_PASSWORD) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Create response and set cookie directly on it
    // This is more reliable than using cookies() from next/headers
    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, password, {
      httpOnly: true, // Middleware can read httpOnly cookies
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Site access error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
