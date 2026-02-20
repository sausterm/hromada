import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const connectionString = process.env.DATABASE_URL || ''
  const isRemoteDb = connectionString.includes('supabase')

  let poolConfig: any

  if (process.env.DB_HOST) {
    // Use explicit parameters (avoids URL-encoding issues with special chars in password)
    poolConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    }
  } else {
    poolConfig = { connectionString }
    if (isRemoteDb) {
      poolConfig.ssl = { rejectUnauthorized: false }
    }
  }

  const pool = new Pool(poolConfig)
  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Cache — in Lambda/SSR, globals persist across requests
  globalForPrisma.prisma = client
  globalForPrisma.pool = pool

  return client
}

// Lazy proxy: defers getPrisma() until first property access,
// so env vars from .env.production are loaded by then
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma()
    return (client as any)[prop]
  },
})
