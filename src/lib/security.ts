import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

// Security constants
export const SECURITY_CONFIG = {
  // Account lockout
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,

  // Password requirements
  MIN_PASSWORD_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,

  // Session
  SESSION_DURATION_DAYS: 7,

  // Rate limiting (requests per window)
  RATE_LIMITS: {
    login: { limit: 5, windowSeconds: 60 },
    passwordReset: { limit: 3, windowSeconds: 3600 },
    api: { limit: 100, windowSeconds: 60 },
  },
} as const

// Audit log actions
export const AuditAction = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED_LOCKED: 'LOGIN_BLOCKED_LOCKED',
  LOGIN_BLOCKED_INACTIVE: 'LOGIN_BLOCKED_INACTIVE',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  SESSION_REVOKED: 'SESSION_REVOKED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  ADMIN_ACTION: 'ADMIN_ACTION',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  // Donation actions
  DONATION_CREATED: 'DONATION_CREATED',
  DONATION_RECEIVED: 'DONATION_RECEIVED',
  DONATION_FORWARDED: 'DONATION_FORWARDED',
  DONATION_COMPLETED: 'DONATION_COMPLETED',
  // Wire transfer actions
  WIRE_CREATED: 'WIRE_CREATED',
  WIRE_INITIATED: 'WIRE_INITIATED',
  WIRE_SENT: 'WIRE_SENT',
  WIRE_CONFIRMED: 'WIRE_CONFIRMED',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

/**
 * Log a security audit event
 */
export async function logAuditEvent(
  action: AuditActionType,
  options: {
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: string
  } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: options.userId || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent?.substring(0, 500) || null,
        details: options.details?.substring(0, 1000) || null,
      },
    })
  } catch (error) {
    // Don't let audit logging failures break the app
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown'
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`)
  }

  if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (SECURITY_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (SECURITY_CONFIG.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common weak patterns
  const commonPatterns = [
    /^123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
    /admin/i,
  ]
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains a common weak pattern')
      break
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Check if account is locked
 */
export function isAccountLocked(user: User): boolean {
  if (!user.lockedUntil) return false
  return new Date() < user.lockedUntil
}

/**
 * Handle failed login attempt
 */
export async function handleFailedLogin(
  user: User,
  request: NextRequest
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const newAttempts = user.failedLoginAttempts + 1
  const shouldLock = newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS

  const updateData: Partial<User> & { failedLoginAttempts: number } = {
    failedLoginAttempts: newAttempts,
  }

  if (shouldLock) {
    const lockUntil = new Date()
    lockUntil.setMinutes(lockUntil.getMinutes() + SECURITY_CONFIG.LOCKOUT_DURATION_MINUTES)
    updateData.lockedUntil = lockUntil

    await logAuditEvent(AuditAction.ACCOUNT_LOCKED, {
      userId: user.id,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
      details: `Account locked after ${newAttempts} failed attempts`,
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  })

  await logAuditEvent(AuditAction.LOGIN_FAILED, {
    userId: user.id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
    details: `Failed attempt ${newAttempts}/${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}`,
  })

  return {
    locked: shouldLock,
    attemptsRemaining: Math.max(0, SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - newAttempts),
  }
}

/**
 * Handle successful login
 */
export async function handleSuccessfulLogin(
  user: User,
  request: NextRequest
): Promise<void> {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: getClientIp(request),
    },
  })

  await logAuditEvent(AuditAction.LOGIN_SUCCESS, {
    userId: user.id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  })
}

/**
 * Revoke all sessions for a user by incrementing session version
 */
export async function revokeAllSessions(userId: string, reason?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      sessionVersion: { increment: 1 },
    },
  })

  await logAuditEvent(AuditAction.SESSION_REVOKED, {
    userId,
    details: reason || 'All sessions revoked',
  })
}

/**
 * Validate session against current user state
 */
export async function validateSession(
  userId: string,
  sessionVersion: number
): Promise<{ valid: boolean; reason?: string; user?: User }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return { valid: false, reason: 'User not found' }
  }

  if (!user.isActive) {
    return { valid: false, reason: 'Account deactivated' }
  }

  if (isAccountLocked(user)) {
    return { valid: false, reason: 'Account locked' }
  }

  if (user.sessionVersion !== sessionVersion) {
    return { valid: false, reason: 'Session revoked' }
  }

  return { valid: true, user }
}

/**
 * Security headers middleware
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy (disable unnecessary features)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs these
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; '),
    // HSTS (only in production)
    ...(process.env.NODE_ENV === 'production'
      ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }
      : {}),
  }
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const headers = getSecurityHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ]

  return suspiciousPatterns.some((pattern) => pattern.test(input))
}
