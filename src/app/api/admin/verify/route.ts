import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Basic ${Buffer.from(`admin:${process.env.ADMIN_PASSWORD || 'admin'}`).toString('base64')}`

  if (authHeader === expectedAuth) {
    return NextResponse.json({ valid: true })
  }

  return NextResponse.json({ valid: false }, { status: 401 })
}
