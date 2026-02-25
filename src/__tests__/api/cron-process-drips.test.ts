/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'

// Mock drip module
const mockProcessDueSteps = jest.fn()
jest.mock('@/lib/drip', () => ({
  processDueSteps: (...args: unknown[]) => mockProcessDueSteps(...args),
}))

import { POST } from '@/app/api/cron/process-drips/route'

function makeRequest(authHeader?: string) {
  const headers: Record<string, string> = {}
  if (authHeader) {
    headers['authorization'] = authHeader
  }
  return new NextRequest(new URL('/api/cron/process-drips', 'http://localhost:3000'), {
    method: 'POST',
    headers,
  })
}

describe('POST /api/cron/process-drips', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, CRON_SECRET: 'test-cron-secret' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('processes due steps with valid auth', async () => {
    mockProcessDueSteps.mockResolvedValue({
      processed: 5,
      sent: 4,
      failed: 1,
      completed: 2,
    })

    const res = await POST(makeRequest('Bearer test-cron-secret'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({
      success: true,
      processed: 5,
      sent: 4,
      failed: 1,
      completed: 2,
    })
  })

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET
    const spy = jest.spyOn(console, 'error').mockImplementation()

    const res = await POST(makeRequest('Bearer anything'))

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Not configured')
    spy.mockRestore()
  })

  it('returns 401 with missing authorization header', async () => {
    const res = await POST(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns 401 with incorrect secret', async () => {
    const res = await POST(makeRequest('Bearer wrong-secret'))

    expect(res.status).toBe(401)
  })

  it('returns 500 when processDueSteps throws', async () => {
    mockProcessDueSteps.mockRejectedValue(new Error('Crash'))
    const spy = jest.spyOn(console, 'error').mockImplementation()

    const res = await POST(makeRequest('Bearer test-cron-secret'))

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to process drip steps')
    spy.mockRestore()
  })
})
