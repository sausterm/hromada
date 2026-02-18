/**
 * @jest-environment node
 */

import { GET } from '@/app/api/admin/verify/route'
import { NextRequest } from 'next/server'

describe('/api/admin/verify', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  const createMockRequest = (authHeader?: string) => {
    const headers = new Headers()
    if (authHeader) {
      headers.set('authorization', authHeader)
    }

    return {
      headers: {
        get: (name: string) => headers.get(name),
      },
    } as unknown as NextRequest
  }

  describe('GET', () => {
    it('returns valid true with correct credentials', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'
      const expectedAuth = `Basic ${Buffer.from('admin:secret123').toString('base64')}`

      const request = createMockRequest(expectedAuth)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.valid).toBe(true)
    })

    it('returns valid false with incorrect password', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'
      const wrongAuth = `Basic ${Buffer.from('admin:wrongpassword').toString('base64')}`

      const request = createMockRequest(wrongAuth)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
    })

    it('returns valid false with no auth header', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
    })

    it('returns 503 when ADMIN_PASSWORD is not set', async () => {
      delete process.env.ADMIN_PASSWORD

      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Admin verification is not configured')
    })

    it('returns 401 with incorrect username', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'
      const wrongUserAuth = `Basic ${Buffer.from('wronguser:secret123').toString('base64')}`

      const request = createMockRequest(wrongUserAuth)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
    })

    it('returns 401 with malformed auth header', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'

      const request = createMockRequest('Bearer some-token')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
    })

    it('returns 401 with empty auth header', async () => {
      process.env.ADMIN_PASSWORD = 'secret123'

      const request = createMockRequest('')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.valid).toBe(false)
    })
  })
})
