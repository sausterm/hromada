import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const COOKIE_NAME = 'hromada_admin_session'

/**
 * Verify admin authentication from request.
 * Supports both:
 * - httpOnly cookie (preferred, secure)
 * - Bearer token header (for API clients, backwards compatibility)
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const adminSecret = process.env.HROMADA_ADMIN_SECRET

  if (!adminSecret) {
    console.error('HROMADA_ADMIN_SECRET not configured')
    return false
  }

  // Method 1: Check Bearer token (for API clients)
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${adminSecret}`) {
    return true
  }

  // Method 2: Check httpOnly cookie (for browser sessions)
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (sessionCookie?.value) {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString()
      const [secret] = decoded.split(':')

      if (secret === adminSecret) {
        return true
      }
    }
  } catch (error) {
    // Cookie parsing failed, continue to return false
  }

  return false
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
