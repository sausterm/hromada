'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hromada_admin_token'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem(STORAGE_KEY)
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((password: string): boolean => {
    // Store the password as the token (will be sent as Bearer token)
    localStorage.setItem(STORAGE_KEY, password)
    setIsAuthenticated(true)
    return true
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }, [])

  const getAuthHeader = useCallback((): string | null => {
    const token = localStorage.getItem(STORAGE_KEY)
    return token ? `Bearer ${token}` : null
  }, [])

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getAuthHeader,
  }
}
