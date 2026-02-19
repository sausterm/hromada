'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'

const HERO_IMAGE = 'https://kwzirplynefqlpvdvpqz.supabase.co/storage/v1/object/public/project-images/site-photos/1748466071929.jpeg'

function USFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <defs>
        <clipPath id="sa-clip-us">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#sa-clip-us)">
        <rect fill="#B22234" width="40" height="40" />
        <rect fill="#FFFFFF" y="3.08" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="9.23" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="15.38" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="21.54" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="27.69" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="33.85" width="40" height="3.08" />
        <rect fill="#3C3B6E" width="16" height="21.54" />
      </g>
    </svg>
  )
}

function UkraineFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <defs>
        <clipPath id="sa-clip-ua">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#sa-clip-ua)">
        <rect fill="#005BBB" width="40" height="20" />
        <rect fill="#FFD500" y="20" width="40" height="20" />
      </g>
    </svg>
  )
}

function SiteAccessForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const locale = useLocale()

  const [showPassword, setShowPassword] = useState(false)
  const [isLangHovered, setIsLangHovered] = useState(false)

  const FlagComponent = locale === 'en' ? USFlag : UkraineFlag
  const OtherFlagComponent = locale === 'en' ? UkraineFlag : USFlag

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/site-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        await new Promise(resolve => setTimeout(resolve, 100))
        // Validate redirect is a safe relative path (prevent open redirect)
        let redirect = searchParams.get('redirect') || '/'
        if (!redirect.startsWith('/') || redirect.startsWith('//')) {
          redirect = '/'
        }
        // Redirect using window.location to ensure full page load with new cookie
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
    <div className="fixed inset-0 flex flex-col bg-[var(--navy-900)] z-50">
      {/* Blurred hero background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-[-20px] bg-cover bg-center animate-[fadeIn_1s_ease-out]"
          style={{
            backgroundImage: `url(${HERO_IMAGE})`,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
        <div className="absolute inset-0 bg-[var(--navy-900)]/70" />
      </div>

      {/* Header bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 animate-[fadeIn_0.8s_ease-out]">
        <div className="flex-1" />

        {/* Center logo */}
        <div className="flex flex-col items-center">
          <span className="font-logo text-[1.4rem] sm:text-[2rem] leading-tight flex items-center text-white">
            <span className="font-semibold">hromada</span>
            <span className="mx-2 inline-block group cursor-pointer" style={{ perspective: '100px' }}>
              <svg
                viewBox="0 0 48 30"
                className="inline-block w-5 h-3 sm:w-7 sm:h-4 sa-logo-flip"
                style={{ transform: 'rotate(-38deg)', transformStyle: 'preserve-3d' }}
              >
                <defs>
                  <mask id="sa-panel">
                    <rect x="0" y="0" width="48" height="30" rx="3" fill="white"/>
                    <line x1="16" y1="0" x2="16" y2="30" stroke="black" strokeWidth="1.5"/>
                    <line x1="32" y1="0" x2="32" y2="30" stroke="black" strokeWidth="1.5"/>
                    <line x1="0" y1="15" x2="48" y2="15" stroke="black" strokeWidth="1.5"/>
                    <circle cx="16" cy="15" r="2.5" fill="black"/>
                    <circle cx="32" cy="15" r="2.5" fill="black"/>
                    <circle cx="0" cy="0" r="2.5" fill="black"/>
                    <circle cx="48" cy="0" r="2.5" fill="black"/>
                    <circle cx="0" cy="30" r="2.5" fill="black"/>
                    <circle cx="48" cy="30" r="2.5" fill="black"/>
                  </mask>
                </defs>
                <rect x="0" y="0" width="48" height="30" rx="3" fill="white" mask="url(#sa-panel)"/>
              </svg>
            </span>
            <span className="font-semibold">громада</span>
          </span>
        </div>

        {/* Right flag */}
        <div className="flex-1 flex justify-end">
          <div
            className="w-9 h-9 rounded-full cursor-pointer"
            onMouseEnter={() => setIsLangHovered(true)}
            onMouseLeave={() => setIsLangHovered(false)}
            style={{ perspective: '100px' }}
          >
            <div
              className="relative w-full h-full transition-transform duration-500 ease-in-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: isLangHovered ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <FlagComponent className="w-full h-full" />
              </div>
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <OtherFlagComponent className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Password card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 animate-[fadeSlideUp_0.8s_ease-out_0.2s_both]">
        <div className="w-full max-w-sm">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  Enter site password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 pr-10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-300">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-white text-[var(--navy-700)] font-semibold py-3 px-4 rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Enter Site'}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-white/40">
              This site is currently in preview mode.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes saLogoFlip {
          0% { transform: rotate(-38deg) rotateY(0deg); }
          100% { transform: rotate(-38deg) rotateY(360deg); }
        }
        .group:hover .sa-logo-flip {
          animation: saLogoFlip 1.2s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default function SiteAccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--navy-900)] flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    }>
      <SiteAccessForm />
    </Suspense>
  )
}
