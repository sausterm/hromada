/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/register/route'

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
      create: jest.fn(),
    },
  },
}))

import { verifyAdminAuth, hashPassword, getUserByEmail } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('POST /api/auth/register', () => {
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

  describe('Authorization', () => {
    it('returns 401 when not authenticated as admin', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized. Admin access required.')
    })

    it('requires admin authentication', async () => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      await POST(request)

      expect(verifyAdminAuth).toHaveBeenCalledWith(request)
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    })

    it('returns 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123', name: 'Test User' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email, password, and name are required')
    })

    it('returns 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', name: 'Test User' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email, password, and name are required')
    })

    it('returns 400 when name is missing', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email, password, and name are required')
    })

    it('returns 400 for invalid email format', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
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

    it('returns 400 for email without domain', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUser,
          email: 'test@',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    it('returns 400 for password less than 8 characters', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUser,
          password: 'short',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 8 characters')
    })

    it('returns 400 for password exactly 7 characters', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUser,
          password: '1234567',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 8 characters')
    })

    it('accepts password exactly 8 characters', async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: validUser.email,
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validUser,
          password: '12345678',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Role handling', () => {
    beforeEach(() => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
    })

    it('accepts ADMIN role', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'ADMIN',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validUser, role: 'ADMIN' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'ADMIN' }),
        })
      )
    })

    it('accepts PARTNER role', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validUser, role: 'PARTNER' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'PARTNER' }),
        })
      )
    })

    it('accepts NONPROFIT_MANAGER role', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'NONPROFIT_MANAGER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validUser, role: 'NONPROFIT_MANAGER' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'NONPROFIT_MANAGER' }),
        })
      )
    })

    it('defaults to PARTNER for invalid role', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validUser, role: 'SUPERUSER' }),
      })

      await POST(request)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'PARTNER' }),
        })
      )
    })

    it('defaults to PARTNER when role is not provided', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const { role, ...userWithoutRole } = validUser
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userWithoutRole),
      })

      await POST(request)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'PARTNER' }),
        })
      )
    })
  })

  describe('Duplicate email handling', () => {
    beforeEach(() => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    })

    it('returns 409 when email already exists', async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing-user' })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User with this email already exists')
    })

    it('checks email in lowercase', async () => {
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'test@example.com',
        name: 'Test',
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validUser, email: 'Test@Example.COM' }),
      })

      await POST(request)

      expect(getUserByEmail).toHaveBeenCalledWith('Test@Example.COM')
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@example.com' }),
        })
      )
    })
  })

  describe('Successful registration', () => {
    beforeEach(() => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed-password')
    })

    it('creates user with hashed password', async () => {
      const createdUser = {
        id: 'new-user-1',
        email: validUser.email.toLowerCase(),
        name: validUser.name,
        organization: validUser.organization,
        role: validUser.role,
        createdAt: new Date(),
      }
      ;(prisma.user.create as jest.Mock).mockResolvedValue(createdUser)

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(hashPassword).toHaveBeenCalledWith(validUser.password)
      expect(data.success).toBe(true)
      expect(data.user.id).toBe('new-user-1')
      expect(data.user.email).toBe(validUser.email.toLowerCase())
      expect(data.user.name).toBe(validUser.name)
      expect(data.user.organization).toBe(validUser.organization)
      expect(data.user.role).toBe(validUser.role)
    })

    it('stores organization as null when not provided', async () => {
      const { organization, ...userWithoutOrg } = validUser
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        name: validUser.name,
        organization: null,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userWithoutOrg),
      })

      await POST(request)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organization: null }),
        })
      )
    })

    it('does not expose passwordHash in response', async () => {
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'new-user-1',
        email: validUser.email,
        passwordHash: 'hashed-password',
        name: validUser.name,
        role: 'PARTNER',
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.user.passwordHash).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
      ;(getUserByEmail as jest.Mock).mockResolvedValue(null)
      ;(hashPassword as jest.Mock).mockResolvedValue('hashed')
    })

    it('returns 500 on database error', async () => {
      ;(prisma.user.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUser),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create user')
    })

    it('returns 500 on invalid JSON body', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create user')
    })
  })
})
