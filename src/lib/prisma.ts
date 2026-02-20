import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  let adapterConfig: Record<string, unknown>

  if (process.env.DB_HOST) {
    // Use explicit parameters (avoids URL-encoding issues with special chars)
    adapterConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    }
  } else {
    adapterConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
    }
  }

  const adapter = new PrismaPg(adapterConfig)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  globalForPrisma.prisma = client
  return client
}

// Lazy proxy: defers createPrisma() until first property access,
// so env vars from .env.production are loaded by then
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createPrisma()
    return (client as any)[prop]
  },
})
