import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'hromada_admin_session'

// GET /api/auth/status - Check if user is authenticated
export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }

    // Validate the session token
    const adminSecret = process.env.HROMADA_ADMIN_SECRET
    if (!adminSecret) {
      return NextResponse.json({ authenticated: false })
    }

    // Decode and verify the token contains the correct secret
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString()
      const [secret] = decoded.split(':')

      if (secret === adminSecret) {
        return NextResponse.json({ authenticated: true })
      }
    } catch {
      // Invalid token format
    }

    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
