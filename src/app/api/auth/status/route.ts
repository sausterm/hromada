import { NextResponse } from 'next/server'
import { getSessionData, getUserById } from '@/lib/auth'

// GET /api/auth/status - Check if user is authenticated and return user info
export async function GET() {
  try {
    const session = await getSessionData()

    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    // Legacy admin session
    if (session.isLegacyAdmin) {
      return NextResponse.json({
        authenticated: true,
        role: 'ADMIN',
        isLegacyAdmin: true,
      })
    }

    // New session format - fetch user details
    if (session.userId) {
      const user = await getUserById(session.userId)

      if (user) {
        return NextResponse.json({
          authenticated: true,
          role: user.role,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            organization: user.organization,
            role: user.role,
          },
        })
      }
    }

    // Session exists but no valid user found
    return NextResponse.json({ authenticated: false })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
