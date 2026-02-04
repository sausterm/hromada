'use client'

// Re-export from useAuth for backward compatibility
export { useAuth as useAdminAuth, useAuth } from './useAuth'
export type { AuthUser, AuthState } from './useAuth'
