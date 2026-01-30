import { renderHook, act, waitFor } from '@testing-library/react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAdminAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

    let loginResult: boolean = false
    await act(async () => {
      loginResult = await result.current.login('my-password')
    })

    expect(loginResult).toBe(true)
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

    let loginResult: boolean = true
    await act(async () => {
      loginResult = await result.current.login('wrong-password')
    })

    expect(loginResult).toBe(false)
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

      let loginResult: boolean = true
      await act(async () => {
        loginResult = await result.current.login('password')
      })

      expect(loginResult).toBe(false)
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
})
