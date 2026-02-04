/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/users/route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
  hashPassword: jest.fn(),
  getUserByEmail: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { verifyAdminAuth, hashPassword, getUserByEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated as admin', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns list of users when authenticated', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const mockUsers = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        organization: null,
        role: 'ADMIN',
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'partner@example.com',
        name: 'Partner User',
        organization: 'Test Org',
        role: 'PARTNER',
        createdAt: new Date(),
      },
    ]
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

    const request = new NextRequest('http://localhost/api/admin/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.users).toHaveLength(2)
    expect(data.users[0].email).toBe('admin@example.com')
    // Should not include passwordHash
    expect(data.users[0].passwordHash).toBeUndefined()
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/admin/users')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch users')
  })
})

describe('POST /api/admin/users', () => {
  const validUser = {
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    name: 'New User',
    organization: 'Test Organization',
    role: 'PARTNER',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated as admin', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when required fields are missing', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('returns 400 for invalid email format', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        email: 'invalid-email',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('returns 400 for weak password', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        password: '123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('8 characters')
  })

  it('defaults invalid role to PARTNER', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-1',
      email: validUser.email,
      name: validUser.name,
      organization: validUser.organization,
      role: 'PARTNER',
      createdAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...validUser,
        role: 'SUPERUSER',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'PARTNER',
        }),
      })
    )
  })

  it('returns 409 when email already exists', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(getUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing' })

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('User with this email already exists')
  })

  it('creates user successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')

    const createdUser = {
      id: 'new-user-1',
      email: validUser.email,
      name: validUser.name,
      organization: validUser.organization,
      role: validUser.role,
      createdAt: new Date(),
    }
    ;(prisma.user.create as jest.Mock).mockResolvedValue(createdUser)

    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validUser),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.email).toBe(validUser.email)
    expect(data.user.passwordHash).toBeUndefined()
    expect(hashPassword).toHaveBeenCalledWith(validUser.password)
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: validUser.email.toLowerCase(),
          passwordHash: 'hashed-password',
          name: validUser.name,
          role: validUser.role,
        }),
      })
    )
  })

  it('defaults role to PARTNER when not provided', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
    ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
    ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new' })

    const { role, ...userWithoutRole } = validUser
    const request = new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userWithoutRole),
    })

    await POST(request)

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: 'PARTNER',
        }),
      })
    )
  })
})
