import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'

const COOKIE_NAME = 'hromada_session'
const SALT_ROUNDS = 12
const JWT_EXPIRATION = '7d'

/**
 * Get the secret key for JWT signing.
 * Requires SESSION_SECRET (min 32 chars). No fallbacks.
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error('SESSION_SECRET environment variable is required')
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionData {
  userId?: string
  email?: string
  role?: UserRole
  sessionVersion?: number
}

interface JWTSessionPayload extends JWTPayload {
  userId?: string
  email?: string
  role?: UserRole
  sessionVersion?: number
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
 * Validate a session against database state
 * Checks: user exists, is active, not locked, session version matches
 */
export async function validateSessionWithDatabase(session: SessionData): Promise<{
  valid: boolean
  reason?: string
  user?: Awaited<ReturnType<typeof getUserById>>
}> {
  if (!session.userId) {
    return { valid: false, reason: 'No user ID in session' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user) {
    return { valid: false, reason: 'User not found' }
  }

  if (!user.isActive) {
    return { valid: false, reason: 'Account deactivated' }
  }

  if (user.lockedUntil && new Date() < user.lockedUntil) {
    return { valid: false, reason: 'Account locked' }
  }

  // Check session version (allows invalidating all sessions)
  if (session.sessionVersion !== undefined && session.sessionVersion !== user.sessionVersion) {
    return { valid: false, reason: 'Session revoked' }
  }

  return { valid: true, user }
}

/**
 * Parse the session cookie and return session data.
 * Only accepts JWT-signed sessions.
 */
export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const token = sessionCookie.value

    try {
      const secret = getSecretKey()
      const { payload } = await jwtVerify(token, secret)
      const sessionPayload = payload as JWTSessionPayload

      return {
        userId: sessionPayload.userId,
        email: sessionPayload.email,
        role: sessionPayload.role,
        sessionVersion: sessionPayload.sessionVersion,
      }
    } catch {
      return null
    }
  } catch (error) {
    return null
  }
}

/**
 * Create a signed JWT session cookie for a user
 */
export async function createSession(userId: string, email: string, role: UserRole, sessionVersion: number = 1) {
  const secret = getSecretKey()

  const token = await new SignJWT({
    userId,
    email,
    role,
    sessionVersion,
  } as JWTSessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
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
 * Only accepts JWT sessions with role === 'ADMIN', validated against the database.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<boolean> {
  const session = await getSessionData()

  if (!session || session.role !== 'ADMIN') {
    return false
  }

  // Validate against database
  const { valid } = await validateSessionWithDatabase(session)
  return valid
}

/**
 * Verify partner authentication from request.
 * Only accepts JWT sessions with PARTNER or NONPROFIT_MANAGER role, validated against DB.
 */
export async function verifyPartnerAuth(request: NextRequest): Promise<SessionData | null> {
  const session = await getSessionData()

  if (!session || (session.role !== 'PARTNER' && session.role !== 'NONPROFIT_MANAGER')) {
    return null
  }

  // Validate against database
  const { valid } = await validateSessionWithDatabase(session)
  if (!valid) return null

  return session
}

/**
 * Verify any authenticated user from request.
 * Only accepts JWT sessions, validated against the database.
 */
export async function verifyAuth(request: NextRequest): Promise<SessionData | null> {
  const session = await getSessionData()
  if (!session || !session.userId) return null

  const { valid } = await validateSessionWithDatabase(session)
  if (!valid) return null

  return session
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

/**
 * Create a signed JWT token (for testing purposes)
 */
export async function createSignedToken(payload: {
  userId?: string
  email?: string
  role?: UserRole
}): Promise<string> {
  const secret = getSecretKey()

  return new SignJWT(payload as JWTSessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secret)
}
