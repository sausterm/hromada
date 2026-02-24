/**
 * @jest-environment node
 */

import { getSecurityHeaders } from '@/lib/security-headers'

describe('getSecurityHeaders', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns X-Frame-Options DENY', () => {
    const headers = getSecurityHeaders()
    expect(headers['X-Frame-Options']).toBe('DENY')
  })

  it('returns X-Content-Type-Options nosniff', () => {
    const headers = getSecurityHeaders()
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
  })

  it('returns X-XSS-Protection', () => {
    const headers = getSecurityHeaders()
    expect(headers['X-XSS-Protection']).toBe('1; mode=block')
  })

  it('returns Referrer-Policy', () => {
    const headers = getSecurityHeaders()
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })

  it('returns Permissions-Policy disabling camera, mic, geolocation', () => {
    const headers = getSecurityHeaders()
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
  })

  it('returns Content-Security-Policy', () => {
    const headers = getSecurityHeaders()
    const csp = headers['Content-Security-Policy']
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("img-src 'self' data: https: blob:")
  })

  it('does not include unsafe-eval in CSP', () => {
    const headers = getSecurityHeaders()
    expect(headers['Content-Security-Policy']).not.toContain('unsafe-eval')
  })

  it('includes HSTS in production', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }
    jest.resetModules()
    const { getSecurityHeaders: getHeaders } = require('@/lib/security-headers')
    const headers = getHeaders()
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains')
  })

  it('does not include HSTS in non-production', () => {
    process.env = { ...originalEnv, NODE_ENV: 'test' }
    const headers = getSecurityHeaders()
    expect(headers['Strict-Transport-Security']).toBeUndefined()
  })
})
