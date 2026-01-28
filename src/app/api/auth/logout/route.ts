import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'hromada_admin_session'

// POST /api/auth/logout - Clear admin session cookie
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
