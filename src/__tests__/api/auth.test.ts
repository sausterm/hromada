/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as loginPOST } from '@/app/api/auth/login/route'
import { POST as logoutPOST } from '@/app/api/auth/logout/route'
import { GET as statusGET } from '@/app/api/auth/status/route'

// Mock next/headers cookies
const mockCookies = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
}

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookies)),
}))

// Mock rate limiting - we'll test rate limiting separately
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => null),
  RATE_LIMITS: {
    login: { limit: 5, windowSeconds: 60 },
  },
}))

import { rateLimit } from '@/lib/rate-limit'

describe('POST /api/auth/login', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, HROMADA_ADMIN_SECRET: 'test-secret-123' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns 400 when password is not provided', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password is required')
  })

  it('returns 401 when password is incorrect', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid password')
  })

  it('returns success and sets cookie when password is correct', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-secret-123' }),
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockCookies.set).toHaveBeenCalledWith(
      'hromada_admin_session',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    )
  })

  it('returns 500 when HROMADA_ADMIN_SECRET is not configured', async () => {
    delete process.env.HROMADA_ADMIN_SECRET

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'any-password' }),
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Server configuration error')
  })

  it('applies rate limiting', async () => {
    const mockRateLimitResponse = new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
    ;(rateLimit as jest.Mock).mockReturnValueOnce(mockRateLimitResponse)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test' }),
    })

    const response = await loginPOST(request)

    expect(response.status).toBe(429)
    expect(rateLimit).toHaveBeenCalled()
  })

  it('returns 500 when an unexpected error occurs', async () => {
    // Create a request with invalid JSON to trigger the catch block
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json{',
    })

    const response = await loginPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Login failed')
  })
})

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deletes the session cookie and returns success', async () => {
    const response = await logoutPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockCookies.delete).toHaveBeenCalledWith('hromada_admin_session')
  })

  it('returns 500 when cookie deletion fails', async () => {
    mockCookies.delete.mockImplementationOnce(() => {
      throw new Error('Cookie deletion failed')
    })

    const response = await logoutPOST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Logout failed')
  })
})

describe('GET /api/auth/status', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, HROMADA_ADMIN_SECRET: 'test-secret-123' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('returns authenticated: false when no cookie is present', async () => {
    mockCookies.get.mockReturnValue(undefined)

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })

  it('returns authenticated: false when cookie value is empty', async () => {
    mockCookies.get.mockReturnValue({ value: '' })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })

  it('returns authenticated: true when cookie contains valid token', async () => {
    // Create a valid session token (base64 encoded secret:timestamp)
    const validToken = Buffer.from('test-secret-123:1234567890').toString('base64')
    mockCookies.get.mockReturnValue({ value: validToken })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(true)
  })

  it('returns authenticated: false when cookie contains invalid secret', async () => {
    const invalidToken = Buffer.from('wrong-secret:1234567890').toString('base64')
    mockCookies.get.mockReturnValue({ value: invalidToken })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })

  it('returns authenticated: false when HROMADA_ADMIN_SECRET is not set', async () => {
    delete process.env.HROMADA_ADMIN_SECRET
    const token = Buffer.from('any-secret:1234567890').toString('base64')
    mockCookies.get.mockReturnValue({ value: token })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })

  it('returns authenticated: false when cookie has invalid base64', async () => {
    mockCookies.get.mockReturnValue({ value: '!!!invalid-base64!!!' })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })

  it('returns authenticated: false when an unexpected error occurs', async () => {
    mockCookies.get.mockImplementationOnce(() => {
      throw new Error('Unexpected error')
    })

    const response = await statusGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(false)
  })
})
