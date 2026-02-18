'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  organization: string | null
  role: UserRole
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  user: AuthUser | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    role: null,
    user: null,
  })

  // Check auth status on mount via secure httpOnly cookie
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()

        if (data.authenticated) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            role: data.role || null,
            user: data.user || null,
          })
        } else {
          setState({
            isAuthenticated: false,
            isLoading: false,
            role: null,
            user: null,
          })
        }
      } catch (error) {
        console.error('Failed to check auth status:', error)
        setState({
          isAuthenticated: false,
          isLoading: false,
          role: null,
          user: null,
        })
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; role?: UserRole }> => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (response.ok) {
          const data = await response.json()
          setState({
            isAuthenticated: true,
            isLoading: false,
            role: data.role || null,
            user: data.user || null,
          })
          return { success: true, role: data.role }
        }

        return { success: false }
      } catch (error) {
        console.error('Login failed:', error)
        return { success: false }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        role: null,
        user: null,
      })
    }
  }, [])

  // Helper to check if user has a specific role
  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]): boolean => {
      if (!state.role) return false

      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(state.role)
      }

      return state.role === requiredRole
    },
    [state.role]
  )

  // Helper to check if user is admin
  const isAdmin = useCallback((): boolean => {
    return state.role === 'ADMIN'
  }, [state.role])

  // Helper to check if user is partner
  const isPartner = useCallback((): boolean => {
    return state.role === 'PARTNER' || state.role === 'NONPROFIT_MANAGER'
  }, [state.role])

  // Helper to check if user is donor
  const isDonor = useCallback((): boolean => {
    return state.role === 'DONOR'
  }, [state.role])

  // Helper to check if user is nonprofit manager
  const isNonprofitManager = useCallback((): boolean => {
    return state.role === 'NONPROFIT_MANAGER'
  }, [state.role])

  // Get the appropriate dashboard path for the user's role
  const getDashboardPath = useCallback((): string => {
    if (state.role === 'ADMIN') return '/admin'
    if (state.role === 'NONPROFIT_MANAGER') return '/nonprofit'
    if (state.role === 'PARTNER') return '/partner'
    if (state.role === 'DONOR') return '/donor'
    return '/'
  }, [state.role])

  return {
    ...state,
    login,
    logout,
    hasRole,
    isAdmin,
    isPartner,
    isDonor,
    isNonprofitManager,
    getDashboardPath,
  }
}

// Keep backward compatibility with old hook name
export { useAuth as useAdminAuth }
