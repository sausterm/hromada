import { renderHook, act, waitFor } from '@testing-library/react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAdminAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('auth status with role and user', () => {
    it('sets role and user when auth status returns them', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        organization: 'Test Org',
        role: 'ADMIN' as const,
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          role: 'ADMIN',
          user: mockUser,
          isLegacyAdmin: false,
        }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe('ADMIN')
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLegacyAdmin).toBe(false)
    })

    it('sets isLegacyAdmin when auth status returns it', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          isLegacyAdmin: true,
        }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isLegacyAdmin).toBe(true)
    })
  })

  it('starts with isLoading true and isAuthenticated false', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAdminAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('sets isAuthenticated true when auth status returns authenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true }),
    })

    const { result } = renderHook(() => useAdminAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/status')
  })

  it('sets isAuthenticated false when auth status returns not authenticated', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAdminAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  it('login calls /api/auth/login and returns true on success', async () => {
    // First call for initial auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAdminAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock login call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    let loginResult: { success: boolean; role?: string } = { success: false }
    await act(async () => {
      loginResult = await result.current.login('my-password')
    })

    expect(loginResult.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'my-password' }),
    })
  })

  it('login returns false on failure', async () => {
    // First call for initial auth check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: false }),
    })

    const { result } = renderHook(() => useAdminAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock failed login call
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid password' }),
    })

    let loginResult: { success: boolean; role?: string } = { success: true }
    await act(async () => {
      loginResult = await result.current.login('wrong-password')
    })

    expect(loginResult.success).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('logout calls /api/auth/logout and sets unauthenticated', async () => {
    // Start authenticated
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true }),
    })

    const { result } = renderHook(() => useAdminAuth())

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    // Mock logout call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
  })

  describe('Error handling', () => {
    beforeEach(() => {
      // Suppress console.error for these tests
      jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('sets isAuthenticated false when auth check fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to check auth status:',
        expect.any(Error)
      )
    })

    it('login returns false when fetch throws error', async () => {
      // First call for initial auth check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Mock login call to throw error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      let loginResult: { success: boolean; role?: string } = { success: true }
      await act(async () => {
        loginResult = await result.current.login('password')
      })

      expect(loginResult.success).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Login failed:',
        expect.any(Error)
      )
    })

    it('logout sets isAuthenticated false even when fetch throws error', async () => {
      // Start authenticated
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Mock logout call to throw error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.logout()
      })

      // Should still set isAuthenticated to false even on error
      expect(result.current.isAuthenticated).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        'Logout failed:',
        expect.any(Error)
      )
    })
  })

  describe('hasRole helper', () => {
    it('returns false when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
    })

    it('returns true when user has the required role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'ADMIN' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(true)
    })

    it('returns false when user has different role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN')).toBe(false)
    })

    it('returns true when user role is in array of required roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole(['ADMIN', 'PARTNER'])).toBe(true)
    })

    it('returns false when user role is not in array of required roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'DONOR' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole(['ADMIN', 'PARTNER'])).toBe(false)
    })
  })

  describe('isAdmin helper', () => {
    it('returns true for ADMIN role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'ADMIN' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin()).toBe(true)
    })

    it('returns true for legacy admin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, isLegacyAdmin: true }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin()).toBe(true)
    })

    it('returns false for non-admin role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAdmin()).toBe(false)
    })
  })

  describe('isPartner helper', () => {
    it('returns true for PARTNER role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isPartner()).toBe(true)
    })

    it('returns true for NONPROFIT_MANAGER role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'NONPROFIT_MANAGER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isPartner()).toBe(true)
    })

    it('returns false for other roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'ADMIN' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isPartner()).toBe(false)
    })
  })

  describe('isDonor helper', () => {
    it('returns true for DONOR role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'DONOR' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isDonor()).toBe(true)
    })

    it('returns false for other roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'ADMIN' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isDonor()).toBe(false)
    })
  })

  describe('isNonprofitManager helper', () => {
    it('returns true for NONPROFIT_MANAGER role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'NONPROFIT_MANAGER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isNonprofitManager()).toBe(true)
    })

    it('returns false for other roles', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isNonprofitManager()).toBe(false)
    })
  })

  describe('getDashboardPath helper', () => {
    it('returns /admin for ADMIN role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'ADMIN' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/admin')
    })

    it('returns /admin for legacy admin', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, isLegacyAdmin: true }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/admin')
    })

    it('returns /nonprofit for NONPROFIT_MANAGER role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'NONPROFIT_MANAGER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/nonprofit')
    })

    it('returns /partner for PARTNER role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'PARTNER' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/partner')
    })

    it('returns /donor for DONOR role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, role: 'DONOR' }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/donor')
    })

    it('returns / for unknown role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.getDashboardPath()).toBe('/')
    })
  })

  describe('login with email and password', () => {
    it('calls /api/auth/login with email and password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, role: 'PARTNER', user: { id: '1' } }),
      })

      let loginResult: { success: boolean; role?: string } = { success: false }
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'password123')
      })

      expect(loginResult.success).toBe(true)
      expect(loginResult.role).toBe('PARTNER')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      })
      expect(result.current.isLegacyAdmin).toBe(false)
    })

    it('sets isLegacyAdmin true for password-only login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      })

      const { result } = renderHook(() => useAdminAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      await act(async () => {
        await result.current.login('admin-secret-password')
      })

      expect(result.current.isLegacyAdmin).toBe(true)
    })
  })
})
