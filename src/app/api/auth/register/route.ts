import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth, hashPassword, getUserByEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { UserRole } from '@prisma/client'
import { parseBody, registerSchema } from '@/lib/validations'

// POST /api/auth/register - Admin-only endpoint to create partner accounts
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const isAdmin = await verifyAdminAuth(request)
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }

  const parsed = await parseBody(request, registerSchema)
  if (parsed.error) return parsed.error

  try {
    const { email, password, name, organization, role } = parsed.data

    const userRole: UserRole = role || 'PARTNER'

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        organization: organization || null,
        role: userRole,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: user.organization,
        role: user.role,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
