import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Temporary diagnostic endpoint — DELETE after debugging
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const host = dbUrl ? dbUrl.replace(/\/\/[^@]*@/, '//***@').split('/')[2] : 'NOT SET'
  const results: Record<string, any> = { dbHost: host }

  // Test 1: Direct pg
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || undefined,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      connectionString: process.env.DB_HOST ? undefined : dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    })
    const r = await pool.query('SELECT count(*) FROM "Project"')
    results.directPg = { ok: true, count: parseInt(r.rows[0].count) }
    await pool.end()
  } catch (e: any) {
    results.directPg = { ok: false, error: e.message }
  }

  // Test 2: Prisma with fresh adapter (constructed here, not imported)
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || undefined,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      connectionString: process.env.DB_HOST ? undefined : dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })
    const count = await prisma.project.count()
    results.prismaAdapter = { ok: true, count }
    await prisma.$disconnect()
    await pool.end()
  } catch (e: any) {
    results.prismaAdapter = { ok: false, error: e.message, code: e.code }
  }

  const ok = results.directPg?.ok && results.prismaAdapter?.ok
  return NextResponse.json(results, { status: ok ? 200 : 500 })
}
