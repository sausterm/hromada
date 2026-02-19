import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary diagnostic endpoint — DELETE after debugging
export async function GET() {
  try {
    const count = await prisma.project.count()
    return NextResponse.json({ ok: true, projectCount: count })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      name: error.constructor?.name,
    }, { status: 500 })
  }
}
