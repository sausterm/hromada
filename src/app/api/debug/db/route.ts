import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { existsSync } from 'fs'

// Temporary diagnostic endpoint — DELETE after debugging
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const host = dbUrl ? dbUrl.replace(/\/\/[^@]*@/, '//***@').split('/')[2] : 'NOT SET'

  try {
    const count = await prisma.project.count()
    return NextResponse.json({ ok: true, projectCount: count, dbHost: host })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      dbHost: host,
      cwd: process.cwd(),
      envFileExists: existsSync('.env.production'),
      envFileInNext: existsSync('.next/.env.production'),
    }, { status: 500 })
  }
}
