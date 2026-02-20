import { NextResponse } from 'next/server'
import { Pool } from 'pg'

// Temporary diagnostic endpoint — DELETE after debugging
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || ''
  const host = dbUrl ? dbUrl.replace(/\/\/[^@]*@/, '//***@').split('/')[2] : 'NOT SET'

  // Try direct pg connection bypassing Prisma entirely
  try {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    })
    const result = await pool.query('SELECT count(*) FROM "Project"')
    await pool.end()
    return NextResponse.json({
      ok: true,
      projectCount: parseInt(result.rows[0].count),
      dbHost: host,
      method: 'direct-pg',
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      dbHost: host,
      dbUrlLength: dbUrl.length,
      dbUrlStart: dbUrl.substring(0, 30),
      cwd: process.cwd(),
    }, { status: 500 })
  }
}
