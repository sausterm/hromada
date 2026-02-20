jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: { create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
  },
}))

import {
  sanitizeInput,
  detectSuspiciousInput,
  validatePasswordStrength,
  getClientIp,
  getUserAgent,
  isAccountLocked,
  SECURITY_CONFIG,
} from '@/lib/security'

describe('sanitizeInput', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(sanitizeInput('a&b')).toBe('a&amp;b')
  })

  it('escapes single quotes', () => {
    expect(sanitizeInput("it's")).toBe('it&#x27;s')
  })
})

describe('detectSuspiciousInput', () => {
  it('detects script tags', () => {
    expect(detectSuspiciousInput('<script>alert(1)</script>')).toBe(true)
  })

  it('detects javascript: protocol', () => {
    expect(detectSuspiciousInput('javascript:void(0)')).toBe(true)
  })

  it('detects event handlers', () => {
    expect(detectSuspiciousInput('onerror=alert(1)')).toBe(true)
  })

  it('returns false for safe input', () => {
    expect(detectSuspiciousInput('Hello, World!')).toBe(false)
  })
})

describe('validatePasswordStrength', () => {
  it('rejects short passwords', () => {
    const result = validatePasswordStrength('Short1!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`)
  })

  it('accepts strong passwords', () => {
    const result = validatePasswordStrength('MyStr0ng!Pass#2024')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects common patterns', () => {
    const result = validatePasswordStrength('Password123456!!')
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Password contains a common weak pattern')
  })
})

describe('isAccountLocked', () => {
  it('returns false when no lockout set', () => {
    const user = { lockedUntil: null } as any
    expect(isAccountLocked(user)).toBe(false)
  })

  it('returns true when lock is in the future', () => {
    const future = new Date(Date.now() + 60000)
    const user = { lockedUntil: future } as any
    expect(isAccountLocked(user)).toBe(true)
  })

  it('returns false when lock has expired', () => {
    const past = new Date(Date.now() - 60000)
    const user = { lockedUntil: past } as any
    expect(isAccountLocked(user)).toBe(false)
  })
})
