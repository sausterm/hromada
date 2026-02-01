import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

    // Set cookie server-side
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, password, {
      httpOnly: false, // Needs to be readable by middleware
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Site access error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
