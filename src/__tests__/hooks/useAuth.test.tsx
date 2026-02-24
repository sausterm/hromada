import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: not authenticated
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ authenticated: false }),
    })
  })

  describe('initial state', () => {
    it('starts with isLoading true', () => {
      const { result } = renderHook(() => useAuth())
      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('checks auth status on mount', async () => {
      renderHook(() => useAuth())

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/status')
      })
    })
  })

  describe('auth status check', () => {
    it('sets authenticated state when status returns authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authenticated: true,
          role: 'PARTNER',
          user: { id: 'user-1', email: 'test@example.com', name: 'Test', organization: null, role: 'PARTNER' },
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe('PARTNER')
      expect(result.current.user?.email).toBe('test@example.com')
    })

    it('sets unauthenticated state when status returns not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.role).toBeNull()
      expect(result.current.user).toBeNull()
    })

    it('handles auth check failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('login', () => {
    it('calls login endpoint with email and password', async () => {
      // First call: auth status check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Second call: login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          role: 'ADMIN',
          user: { id: 'user-1', email: 'admin@example.com', name: 'Admin', organization: null, role: 'ADMIN' },
        }),
      })

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('admin@example.com', 'password123')
      })

      expect(loginResult!.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
      })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.role).toBe('ADMIN')
    })

    it('returns success false on failed login', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'wrong')
      })

      expect(loginResult!.success).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('returns success false on network error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      let loginResult: { success: boolean }
      await act(async () => {
        loginResult = await result.current.login('user@example.com', 'pass')
      })

      expect(loginResult!.success).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('logout', () => {
    it('calls logout endpoint and resets state', async () => {
      // Start authenticated
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authenticated: true,
          role: 'PARTNER',
          user: { id: 'user-1', email: 'test@example.com', name: 'Test', organization: null, role: 'PARTNER' },
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Logout
      mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) })

      await act(async () => {
        await result.current.logout()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.role).toBeNull()
      expect(result.current.user).toBeNull()
    })

    it('resets state even when logout fetch fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authenticated: true,
          role: 'ADMIN',
          user: { id: 'user-1', email: 'admin@example.com', name: 'Admin', organization: null, role: 'ADMIN' },
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      consoleSpy.mockRestore()
    })
  })

  describe('role helpers', () => {
    async function setupAuthenticatedHook(role: string) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authenticated: true,
          role,
          user: { id: 'user-1', email: 'test@example.com', name: 'Test', organization: null, role },
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      return result
    }

    it('isAdmin returns true for ADMIN role', async () => {
      const result = await setupAuthenticatedHook('ADMIN')
      expect(result.current.isAdmin()).toBe(true)
    })

    it('isAdmin returns false for non-ADMIN role', async () => {
      const result = await setupAuthenticatedHook('PARTNER')
      expect(result.current.isAdmin()).toBe(false)
    })

    it('isPartner returns true for PARTNER role', async () => {
      const result = await setupAuthenticatedHook('PARTNER')
      expect(result.current.isPartner()).toBe(true)
    })

    it('isPartner returns true for NONPROFIT_MANAGER role', async () => {
      const result = await setupAuthenticatedHook('NONPROFIT_MANAGER')
      expect(result.current.isPartner()).toBe(true)
    })

    it('isPartner returns false for ADMIN role', async () => {
      const result = await setupAuthenticatedHook('ADMIN')
      expect(result.current.isPartner()).toBe(false)
    })

    it('isDonor returns true for DONOR role', async () => {
      const result = await setupAuthenticatedHook('DONOR')
      expect(result.current.isDonor()).toBe(true)
    })

    it('isNonprofitManager returns true for NONPROFIT_MANAGER role', async () => {
      const result = await setupAuthenticatedHook('NONPROFIT_MANAGER')
      expect(result.current.isNonprofitManager()).toBe(true)
    })

    it('hasRole checks single role', async () => {
      const result = await setupAuthenticatedHook('ADMIN')
      expect(result.current.hasRole('ADMIN' as any)).toBe(true)
      expect(result.current.hasRole('PARTNER' as any)).toBe(false)
    })

    it('hasRole checks array of roles', async () => {
      const result = await setupAuthenticatedHook('PARTNER')
      expect(result.current.hasRole(['PARTNER', 'ADMIN'] as any)).toBe(true)
      expect(result.current.hasRole(['ADMIN', 'DONOR'] as any)).toBe(false)
    })

    it('hasRole returns false when not authenticated', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.hasRole('ADMIN' as any)).toBe(false)
    })
  })

  describe('getDashboardPath', () => {
    async function setupWithRole(role: string) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authenticated: true,
          role,
          user: { id: 'user-1', email: 'test@example.com', name: 'Test', organization: null, role },
        }),
      })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      return result
    }

    it('returns /admin for ADMIN', async () => {
      const result = await setupWithRole('ADMIN')
      expect(result.current.getDashboardPath()).toBe('/admin')
    })

    it('returns /nonprofit for NONPROFIT_MANAGER', async () => {
      const result = await setupWithRole('NONPROFIT_MANAGER')
      expect(result.current.getDashboardPath()).toBe('/nonprofit')
    })

    it('returns /partner for PARTNER', async () => {
      const result = await setupWithRole('PARTNER')
      expect(result.current.getDashboardPath()).toBe('/partner')
    })

    it('returns /donor for DONOR', async () => {
      const result = await setupWithRole('DONOR')
      expect(result.current.getDashboardPath()).toBe('/donor')
    })

    it('returns / for unknown role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ authenticated: false }),
      })

      const { result } = renderHook(() => useAuth())
      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.getDashboardPath()).toBe('/')
    })
  })
})
