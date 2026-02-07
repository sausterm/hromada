/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/admin/users/[id]/route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyAdminAuth: jest.fn(),
  hashPassword: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { verifyAdminAuth, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

describe('GET /api/admin/users/[id]', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    organization: 'Test Org',
    role: 'PARTNER',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-15'),
    _count: {
      projectSubmissions: 5,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated as admin', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/users/user-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns user when authenticated', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.id).toBe('user-1')
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.name).toBe('Test User')
    expect(data.user.organization).toBe('Test Org')
    expect(data.user.role).toBe('PARTNER')
    expect(data.user._count.projectSubmissions).toBe(5)
  })

  it('returns 404 when user is not found', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/users/nonexistent')
    const response = await GET(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/admin/users/user-1')
    const response = await GET(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch user')
  })

  it('selects correct fields from database', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-1')
    await GET(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projectSubmissions: true,
          },
        },
      },
    })
  })
})

describe('PATCH /api/admin/users/[id]', () => {
  const existingUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    organization: 'Test Org',
    role: 'PARTNER',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated as admin', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when user does not exist', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/users/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('updates name successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      name: 'Updated Name',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.name).toBe('Updated Name')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      })
    )
  })

  it('updates organization successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      organization: 'New Organization',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization: 'New Organization' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.organization).toBe('New Organization')
  })

  it('sets organization to null when empty string provided', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      organization: null,
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization: '' }),
    })

    await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organization: null }),
      })
    )
  })

  it('updates role to ADMIN successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      role: 'ADMIN',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.role).toBe('ADMIN')
  })

  it('updates role to NONPROFIT_MANAGER successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      role: 'NONPROFIT_MANAGER',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'NONPROFIT_MANAGER' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(response.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'NONPROFIT_MANAGER' }),
      })
    )
  })

  it('returns 400 for invalid role', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'SUPERUSER' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid role')
  })

  it('updates password successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(hashPassword as jest.Mock).mockResolvedValue('new-hashed-password')
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(response.status).toBe(200)
    expect(hashPassword).toHaveBeenCalledWith('newpassword123')
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: 'new-hashed-password' }),
      })
    )
  })

  it('returns 400 when password is too short', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'short' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password must be at least 8 characters')
  })

  it('ignores empty password string', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      name: 'New Name',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name', password: '' }),
    })

    await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(hashPassword).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ passwordHash: expect.anything() }),
      })
    )
  })

  it('updates multiple fields at once', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      name: 'New Name',
      organization: 'New Org',
      role: 'ADMIN',
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Name',
        organization: 'New Org',
        role: 'ADMIN',
      }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.name).toBe('New Name')
    expect(data.user.organization).toBe('New Org')
    expect(data.user.role).toBe('ADMIN')
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update user')
  })

  it('does not update when no fields are provided', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.update as jest.Mock).mockResolvedValue({
      ...existingUser,
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {},
      })
    )
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  const existingUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when not authenticated as admin', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when user does not exist', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/admin/users/nonexistent', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('deletes user successfully', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.delete as jest.Mock).mockResolvedValue(existingUser)

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('returns 500 on database error', async () => {
    ;(verifyAdminAuth as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser)
    ;(prisma.user.delete as jest.Mock).mockRejectedValue(new Error('DB error'))

    const request = new NextRequest('http://localhost/api/admin/users/user-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, { params: Promise.resolve({ id: 'user-1' }) })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to delete user')
  })
})
