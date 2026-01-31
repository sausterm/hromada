import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export async function GET() {
  const envCheck = {
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlLength: process.env.DATABASE_URL?.length || 0,
    dbUrlStart: process.env.DATABASE_URL?.substring(0, 30) || 'not set',
    hasDbHost: !!process.env.DB_HOST,
    dbHost: process.env.DB_HOST || 'not set',
    hasDbPassword: !!process.env.DB_PASSWORD,
    dbPasswordLength: process.env.DB_PASSWORD?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  }

  let dbStatus = 'not tested'
  let dbError = null

  try {
    const poolConfig: any = process.env.DB_HOST
      ? {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'postgres',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD,
          ssl: { rejectUnauthorized: false },
        }
      : {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }

    const pool = new Pool(poolConfig)
    const result = await pool.query('SELECT count(*) FROM "Project"')
    dbStatus = `connected - ${result.rows[0].count} projects`
    await pool.end()
  } catch (e: any) {
    dbStatus = 'failed'
    dbError = e.message
  }

  return NextResponse.json({
    env: envCheck,
    db: { status: dbStatus, error: dbError },
    timestamp: new Date().toISOString(),
  })
}
