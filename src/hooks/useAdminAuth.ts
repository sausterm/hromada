'use client'

import { useState, useEffect, useCallback } from 'react'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check auth status on mount via secure httpOnly cookie
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Failed to check auth status:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        return true
      }

      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsAuthenticated(false)
    }
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
  }
}
