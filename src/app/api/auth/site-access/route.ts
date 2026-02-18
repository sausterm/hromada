import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const COOKIE_NAME = 'hromada_site_access'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Derive an HMAC token from the site password using Web Crypto (edge-compatible).
 * The token is stored in the cookie instead of the raw password.
 */
async function deriveHmacToken(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode('hromada_site_access'))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// POST /api/auth/site-access - Verify site password and set cookie
export async function POST(request: NextRequest) {
  // Rate limit: 5 attempts per minute per IP
  const rateLimitResponse = rateLimit(request, { limit: 5, windowSeconds: 60 })
  if (rateLimitResponse) return rateLimitResponse

  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) {
    return NextResponse.json(
      { error: 'Site access is not configured' },
      { status: 503 }
    )
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

    if (password !== sitePassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }

    // Derive HMAC token to store in cookie (not the raw password)
    const token = await deriveHmacToken(sitePassword)

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
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
