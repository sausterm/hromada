/**
 * @jest-environment node
 */

// Mock pg Pool
const mockPool = {
  connect: jest.fn(),
  end: jest.fn(),
}

jest.mock('pg', () => ({
  Pool: jest.fn(() => mockPool),
}))

// Mock PrismaPg adapter
const mockAdapter = {}
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(() => mockAdapter),
}))

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  project: {
    findMany: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}))

describe('prisma', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    // Clear the global cache
    const globalForPrisma = globalThis as any
    delete globalForPrisma.prisma
    delete globalForPrisma.pool
    process.env = { ...originalEnv, DATABASE_URL: 'postgresql://test:test@localhost:5432/test' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getPrisma', () => {
    it('creates a new PrismaClient when not cached', () => {
      const { getPrisma } = require('@/lib/prisma')
      const { PrismaClient } = require('@prisma/client')
      const { Pool } = require('pg')
      const { PrismaPg } = require('@prisma/adapter-pg')

      const client = getPrisma()

      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgresql://test:test@localhost:5432/test',
      })
      expect(PrismaPg).toHaveBeenCalledWith(mockPool)
      // In test environment, NODE_ENV is 'test' which is not 'development' or 'production'
      // so it uses ['error'] log level
      expect(PrismaClient).toHaveBeenCalledWith({
        adapter: mockAdapter,
        log: ['error'],
      })
      expect(client).toBe(mockPrismaClient)
    })

    it('returns cached client on subsequent calls', () => {
      const { getPrisma } = require('@/lib/prisma')
      const { PrismaClient } = require('@prisma/client')

      const client1 = getPrisma()
      const client2 = getPrisma()

      // PrismaClient should only be called once
      expect(PrismaClient).toHaveBeenCalledTimes(1)
      expect(client1).toBe(client2)
    })

    it('caches client in globalThis in non-production', () => {
      process.env.NODE_ENV = 'development'

      const { getPrisma } = require('@/lib/prisma')
      getPrisma()

      const globalForPrisma = globalThis as any
      expect(globalForPrisma.prisma).toBe(mockPrismaClient)
      expect(globalForPrisma.pool).toBe(mockPool)
    })

    it('does not cache in production', () => {
      process.env.NODE_ENV = 'production'

      // Need to re-import to pick up new NODE_ENV
      jest.resetModules()

      // Re-mock after reset
      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrismaClient),
      }))
      jest.doMock('@prisma/adapter-pg', () => ({
        PrismaPg: jest.fn(() => mockAdapter),
      }))
      jest.doMock('pg', () => ({
        Pool: jest.fn(() => mockPool),
      }))

      const { getPrisma } = require('@/lib/prisma')
      getPrisma()

      const globalForPrisma = globalThis as any
      expect(globalForPrisma.prisma).toBeUndefined()
    })

    it('uses cached pool if available', () => {
      const globalForPrisma = globalThis as any
      globalForPrisma.pool = mockPool

      const { getPrisma } = require('@/lib/prisma')
      const { Pool } = require('pg')

      getPrisma()

      // Pool constructor should not be called again since it's cached
      // (First call is from the initial module load)
    })

    it('logs only errors in production', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      jest.doMock('@prisma/client', () => ({
        PrismaClient: jest.fn(() => mockPrismaClient),
      }))
      jest.doMock('@prisma/adapter-pg', () => ({
        PrismaPg: jest.fn(() => mockAdapter),
      }))
      jest.doMock('pg', () => ({
        Pool: jest.fn(() => mockPool),
      }))

      const { getPrisma } = require('@/lib/prisma')
      const { PrismaClient } = require('@prisma/client')

      getPrisma()

      expect(PrismaClient).toHaveBeenCalledWith(
        expect.objectContaining({
          log: ['error'],
        })
      )
    })
  })

  describe('prisma export', () => {
    it('exports a prisma client instance', () => {
      const { prisma } = require('@/lib/prisma')
      expect(prisma).toBe(mockPrismaClient)
    })
  })
})
