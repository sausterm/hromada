import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    console.error('[admin/verify] ADMIN_PASSWORD environment variable is not set')
    return NextResponse.json(
      { error: 'Admin verification is not configured' },
      { status: 503 }
    )
  }

  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`admin:${adminPassword}`).toString('base64')}`

  if (authHeader === expectedAuth) {
    return NextResponse.json({ valid: true })
  }

  return NextResponse.json({ valid: false }, { status: 401 })
}
