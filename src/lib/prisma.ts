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

  // Create connection pool - enable SSL for Supabase connections
  const connectionString = process.env.DATABASE_URL || ''
  const isRemoteDb = connectionString.includes('supabase.co')

  // Parse connection string to avoid URL encoding issues
  let poolConfig: any = { connectionString }

  if (isRemoteDb && process.env.DB_HOST) {
    // Use explicit parameters if provided (for production)
    poolConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' },
    }
  } else if (isRemoteDb) {
    poolConfig.ssl = { rejectUnauthorized: false }
  }

  const pool = globalForPrisma.pool ?? new Pool(poolConfig)

  // Create Prisma adapter
  const adapter = new PrismaPg(pool)

  // Create Prisma client with adapter
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  // Cache in all environments — in Lambda/SSR, the global persists
  // across requests within the same instance
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
