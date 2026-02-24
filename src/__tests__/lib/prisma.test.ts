/**
 * @jest-environment node
 */

// Mock PrismaPg adapter
const mockAdapter = {}
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn(() => mockAdapter),
}))

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  project: { findMany: jest.fn() },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}))

describe('prisma module', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    const g = globalThis as any
    delete g.prisma
    process.env = { ...originalEnv, DATABASE_URL: 'postgresql://test:test@localhost:5432/testdb' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('exports a prisma proxy object', () => {
    const mod = require('@/lib/prisma')
    expect(mod.prisma).toBeDefined()
  })

  it('creates PrismaClient on first property access', () => {
    const { PrismaClient } = require('@prisma/client')
    const mod = require('@/lib/prisma')

    // Access a property to trigger lazy creation
    void mod.prisma.project

    expect(PrismaClient).toHaveBeenCalledTimes(1)
  })

  it('reuses cached client on subsequent accesses', () => {
    const { PrismaClient } = require('@prisma/client')
    const mod = require('@/lib/prisma')

    void mod.prisma.project
    void mod.prisma.$connect

    expect(PrismaClient).toHaveBeenCalledTimes(1)
  })

  it('caches client in globalThis', () => {
    const mod = require('@/lib/prisma')
    void mod.prisma.project

    expect((globalThis as any).prisma).toBe(mockPrismaClient)
  })

  it('uses DATABASE_URL connection string', () => {
    const { PrismaPg } = require('@prisma/adapter-pg')
    const mod = require('@/lib/prisma')
    void mod.prisma.project

    expect(PrismaPg).toHaveBeenCalledWith(
      expect.objectContaining({ connectionString: 'postgresql://test:test@localhost:5432/testdb' })
    )
  })

  it('uses DB_HOST params when set', () => {
    process.env = {
      ...originalEnv,
      DB_HOST: 'db.example.com',
      DB_PORT: '5433',
      DB_NAME: 'mydb',
      DB_USER: 'myuser',
      DB_PASSWORD: 'mypass',
    }
    jest.resetModules()

    // Re-mock after reset
    jest.doMock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn(() => mockAdapter) }))
    jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrismaClient) }))

    const { PrismaPg } = require('@prisma/adapter-pg')
    const mod = require('@/lib/prisma')
    void mod.prisma.project

    expect(PrismaPg).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'db.example.com',
        port: 5433,
        database: 'mydb',
        user: 'myuser',
        password: 'mypass',
      })
    )
  })

  it('logs errors only in production', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production', DATABASE_URL: 'postgresql://test@localhost/db' }
    jest.resetModules()

    jest.doMock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn(() => mockAdapter) }))
    jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrismaClient) }))

    const { PrismaClient } = require('@prisma/client')
    const mod = require('@/lib/prisma')
    void mod.prisma.project

    expect(PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ['error'] })
    )
  })

  it('logs errors and warnings in development', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development', DATABASE_URL: 'postgresql://test@localhost/db' }
    jest.resetModules()

    jest.doMock('@prisma/adapter-pg', () => ({ PrismaPg: jest.fn(() => mockAdapter) }))
    jest.doMock('@prisma/client', () => ({ PrismaClient: jest.fn(() => mockPrismaClient) }))

    const { PrismaClient } = require('@prisma/client')
    const mod = require('@/lib/prisma')
    void mod.prisma.project

    expect(PrismaClient).toHaveBeenCalledWith(
      expect.objectContaining({ log: ['error', 'warn'] })
    )
  })

  it('delegates property access to the real PrismaClient', () => {
    const mod = require('@/lib/prisma')
    const project = mod.prisma.project

    expect(project).toBe(mockPrismaClient.project)
  })
})
