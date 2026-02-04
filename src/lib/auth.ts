import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'

const COOKIE_NAME = 'hromada_session'
const SALT_ROUNDS = 12

export interface SessionData {
  userId?: string
  email?: string
  role?: UserRole
  isLegacyAdmin?: boolean
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

/**
 * Parse the session cookie and return session data
 */
export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const decoded = Buffer.from(sessionCookie.value, 'base64').toString()

    // Try to parse as JSON (new format with user data)
    try {
      const sessionData = JSON.parse(decoded) as SessionData
      return sessionData
    } catch {
      // Fall back to legacy format (secret:timestamp)
      const [secret] = decoded.split(':')
      const adminSecret = process.env.HROMADA_ADMIN_SECRET

      if (adminSecret && secret === adminSecret) {
        return { isLegacyAdmin: true, role: 'ADMIN' as UserRole }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Create a session cookie for a user
 */
export async function createSession(userId: string, email: string, role: UserRole) {
  const sessionData: SessionData = {
    userId,
    email,
    role,
  }

  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Create a legacy admin session (for backward compatibility)
 */
export async function createLegacyAdminSession() {
  const adminSecret = process.env.HROMADA_ADMIN_SECRET
  if (!adminSecret) return

  const sessionToken = Buffer.from(`${adminSecret}:${Date.now()}`).toString('base64')

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

/**
 * Clear the session cookie
 */
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Verify admin authentication from request.
 * Supports both:
 * - httpOnly cookie (preferred, secure)
 * - Bearer token header (for API clients, backwards compatibility)
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const adminSecret = process.env.HROMADA_ADMIN_SECRET

  // Method 1: Check Bearer token (for API clients)
  if (adminSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${adminSecret}`) {
      return true
    }
  }

  // Method 2: Check session cookie
  const session = await getSessionData()

  if (session) {
    // Legacy admin session
    if (session.isLegacyAdmin) {
      return true
    }

    // New session format - check role
    if (session.role === 'ADMIN') {
      return true
    }
  }

  return false
}

/**
 * Verify partner authentication from request
 */
export async function verifyPartnerAuth(request: NextRequest): Promise<SessionData | null> {
  const session = await getSessionData()

  if (session && (session.role === 'PARTNER' || session.role === 'NONPROFIT_MANAGER')) {
    return session
  }

  return null
}

/**
 * Verify any authenticated user from request
 */
export async function verifyAuth(request: NextRequest): Promise<SessionData | null> {
  // Check Bearer token for admin
  const adminSecret = process.env.HROMADA_ADMIN_SECRET
  if (adminSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${adminSecret}`) {
      return { isLegacyAdmin: true, role: 'ADMIN' as UserRole }
    }
  }

  return getSessionData()
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
