'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hromada_admin_token'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Verify token by making a test API call
  const verifyToken = useCallback(async (password: string): Promise<boolean> => {
    try {
      const authHeader = `Basic ${btoa(`admin:${password}`)}`
      const response = await fetch('/api/admin/verify', {
        headers: { Authorization: authHeader },
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    // Check for existing token on mount and verify it
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      verifyToken(token).then((valid) => {
        if (valid) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [verifyToken])

  const login = useCallback(async (password: string): Promise<boolean> => {
    const valid = await verifyToken(password)
    if (valid) {
      localStorage.setItem(STORAGE_KEY, password)
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [verifyToken])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }, [])

  const getAuthHeader = useCallback((): string | null => {
    const token = localStorage.getItem(STORAGE_KEY)
    return token ? `Basic ${btoa(`admin:${token}`)}` : null
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeader,
  }
}
