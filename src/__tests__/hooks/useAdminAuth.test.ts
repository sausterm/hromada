import { renderHook, act } from '@testing-library/react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

// Access the mock through global
declare global {
  // eslint-disable-next-line no-var
  var __localStorageMock: {
    getItem: jest.Mock
    setItem: jest.Mock
    removeItem: jest.Mock
    clear: jest.Mock
  }
}

describe('useAdminAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('returns isAuthenticated false initially when no token', () => {
    const { result } = renderHook(() => useAdminAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns isAuthenticated true when token exists', async () => {
    // Set up the mock to return a token
    localStorage.setItem('hromada_admin_token', 'test-token')

    const { result } = renderHook(() => useAdminAuth())

    // Wait for useEffect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login stores token and sets authenticated', () => {
    const { result } = renderHook(() => useAdminAuth())

    act(() => {
      result.current.login('my-password')
    })

    expect(global.__localStorageMock.setItem).toHaveBeenCalledWith('hromada_admin_token', 'my-password')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('logout removes token and sets unauthenticated', async () => {
    localStorage.setItem('hromada_admin_token', 'test-token')

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(global.__localStorageMock.removeItem).toHaveBeenCalledWith('hromada_admin_token')
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('getAuthHeader returns Bearer token when authenticated', async () => {
    localStorage.setItem('hromada_admin_token', 'test-token')

    const { result } = renderHook(() => useAdminAuth())

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(result.current.getAuthHeader()).toBe('Bearer test-token')
  })

  it('getAuthHeader returns null when not authenticated', () => {
    const { result } = renderHook(() => useAdminAuth())
    expect(result.current.getAuthHeader()).toBe(null)
  })
})
