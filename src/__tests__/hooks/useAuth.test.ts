import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Mock prisma client types
jest.mock('@prisma/client', () => ({
  UserRole: {
    ADMIN: 'ADMIN',
    PARTNER: 'PARTNER',
    DONOR: 'DONOR',
    NONPROFIT_MANAGER: 'NONPROFIT_MANAGER',
  },
}))

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  it('starts with loading state', () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('sets authenticated state when status check succeeds', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        authenticated: true,
        role: 'ADMIN',
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', organization: null },
      }),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('ADMIN')
    expect(result.current.user?.name).toBe('Admin')
  })

  it('sets unauthenticated state when status check fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.role).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('handles fetch error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
    consoleSpy.mockRestore()
  })

  describe('login', () => {
    it('returns success on successful login', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ authenticated: false }) }) // status check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            role: 'DONOR',
            user: { id: '2', name: 'Donor', email: 'donor@test.com', role: 'DONOR', organization: null },
          }),
        }) // login

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('donor@test.com', 'password')
      })

      expect(loginResult!.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe('DONOR')
    })

    it('returns failure on failed login', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ authenticated: false }) })
        .mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('bad@test.com', 'wrong')
      })

      expect(loginResult!.success).toBe(false)
    })

    it('handles login fetch error', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ json: async () => ({ authenticated: false }) })
        .mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('test@test.com', 'pass')
      })

      expect(loginResult!.success).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('logout', () => {
    it('clears auth state on logout', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({
            authenticated: true,
            role: 'ADMIN',
            user: { id: '1', name: 'Admin', email: 'admin@test.com' },
          }),
        })
        .mockResolvedValueOnce({}) // logout POST

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.role).toBeNull()
      expect(result.current.user).toBeNull()
    })

    it('clears state even if logout API fails', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ authenticated: true, role: 'ADMIN', user: { id: '1' } }),
        })
        .mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('role helpers', () => {
    it('hasRole checks single role', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: true, role: 'ADMIN', user: { id: '1' } }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(true)
      expect(result.current.hasRole('DONOR')).toBe(false)
    })

    it('hasRole checks array of roles', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: true, role: 'DONOR', user: { id: '1' } }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole(['DONOR', 'ADMIN'])).toBe(true)
      expect(result.current.hasRole(['PARTNER'])).toBe(false)
    })

    it('hasRole returns false when no role', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
    })

    it('isAdmin returns true for admin role', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: true, role: 'ADMIN', user: { id: '1' } }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.isAdmin()).toBe(true)
      expect(result.current.isPartner()).toBe(false)
      expect(result.current.isDonor()).toBe(false)
    })

    it('isPartner returns true for partner and nonprofit manager', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: true, role: 'NONPROFIT_MANAGER', user: { id: '1' } }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.isPartner()).toBe(true)
      expect(result.current.isNonprofitManager()).toBe(true)
    })

    it('getDashboardPath returns correct path per role', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: true, role: 'ADMIN', user: { id: '1' } }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.getDashboardPath()).toBe('/admin')
    })

    it('getDashboardPath returns / for unknown role', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.getDashboardPath()).toBe('/')
    })
  })
})
