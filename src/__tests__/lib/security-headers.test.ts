import { getSecurityHeaders } from '@/lib/security-headers'

describe('security-headers module', () => {
  it('returns all required security headers', () => {
    const headers = getSecurityHeaders()

    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-XSS-Protection']).toBe('1; mode=block')
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
    expect(headers['Content-Security-Policy']).toBeDefined()
  })

  it('includes HSTS in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const headers = getSecurityHeaders()
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains')

    process.env.NODE_ENV = originalEnv
  })

  it('excludes HSTS in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const headers = getSecurityHeaders()
    expect(headers['Strict-Transport-Security']).toBeUndefined()

    process.env.NODE_ENV = originalEnv
  })
})
