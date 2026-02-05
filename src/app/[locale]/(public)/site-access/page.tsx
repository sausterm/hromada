'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SiteAccessForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Use API route to set cookie server-side
      const response = await fetch('/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        // Small delay to ensure cookie is set before redirect
        await new Promise(resolve => setTimeout(resolve, 100))
        // Redirect using window.location to ensure full page load with new cookie
        const redirect = searchParams.get('redirect') || '/'
        window.location.href = redirect
      } else {
        const data = await response.json()
        setError(data.error || 'Incorrect password')
        setIsLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg border border-[var(--cream-300)] p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-logo text-[var(--navy-700)] text-3xl flex items-center justify-center">
              <span>hromada</span>
              <span
                className="mx-2 inline-block group cursor-pointer"
                style={{ perspective: '100px' }}
              >
                <svg
                  viewBox="0 0 48 30"
                  className="w-8 h-5 logo-flip"
                  style={{ transform: 'rotate(-38deg)', transformStyle: 'preserve-3d' }}
                >
                  <rect x="0" y="0" width="48" height="30" rx="3" fill="currentColor"/>
                  <line x1="16" y1="0" x2="16" y2="30" stroke="var(--cream-100)" strokeWidth="1.5"/>
                  <line x1="32" y1="0" x2="32" y2="30" stroke="var(--cream-100)" strokeWidth="1.5"/>
                  <line x1="0" y1="15" x2="48" y2="15" stroke="var(--cream-100)" strokeWidth="1.5"/>
                  <circle cx="16" cy="15" r="2.5" fill="var(--cream-100)"/>
                  <circle cx="32" cy="15" r="2.5" fill="var(--cream-100)"/>
                  <circle cx="0" cy="0" r="2.5" fill="var(--cream-100)"/>
                  <circle cx="48" cy="0" r="2.5" fill="var(--cream-100)"/>
                  <circle cx="0" cy="30" r="2.5" fill="var(--cream-100)"/>
                  <circle cx="48" cy="30" r="2.5" fill="var(--cream-100)"/>
                </svg>
                <style jsx>{`
                  @keyframes logoFlip {
                    0% { transform: rotate(-38deg) rotateY(0deg); }
                    100% { transform: rotate(-38deg) rotateY(360deg); }
                  }
                  .group:hover .logo-flip {
                    animation: logoFlip 1.2s ease-in-out;
                  }
                `}</style>
              </span>
              <span>громада</span>
            </h1>
            <p className="text-sm text-[var(--navy-500)] mt-2 italic whitespace-nowrap">
              Built to support renewable infrastructure recovery
            </p>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--navy-700)] mb-1">
                Enter site password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-300)] focus:border-[var(--navy-500)]"
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-[var(--navy-700)] hover:bg-[var(--navy-800)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Enter Site'}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-[var(--navy-400)]">
            This site is currently in preview mode.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SiteAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--cream-50)] flex items-center justify-center">
        <div className="text-[var(--navy-500)]">Loading...</div>
      </div>
    }>
      <SiteAccessForm />
    </Suspense>
  )
}
