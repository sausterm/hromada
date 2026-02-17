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
    <div className="relative min-h-screen flex flex-col">
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  autoFocus
                />
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
