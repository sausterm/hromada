'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { locales, type Locale } from '@/i18n'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  children?: React.ReactNode // For filter bar content
}

export function Header({ children }: HeaderProps) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isAdmin, isPartner } = useAuth()
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [isLangHovered, setIsLangHovered] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  // Determine dashboard link based on user role
  const dashboardLink = isAdmin() ? '/admin' : '/partner'

  // Close nav dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false)
      }
    }

    if (isNavMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNavMenuOpen])

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
  }

  // Flag components that fill the circular button
  const USFlag = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <defs>
        <clipPath id="circleClipUS">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#circleClipUS)">
        {/* Red and white stripes */}
        <rect fill="#B22234" width="40" height="40" />
        <rect fill="#FFFFFF" y="3.08" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="9.23" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="15.38" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="21.54" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="27.69" width="40" height="3.08" />
        <rect fill="#FFFFFF" y="33.85" width="40" height="3.08" />
        {/* Blue canton */}
        <rect fill="#3C3B6E" width="16" height="21.54" />
      </g>
    </svg>
  )

  const UkraineFlag = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" className={className}>
      <defs>
        <clipPath id="circleClipUA">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#circleClipUA)">
        {/* Blue top half */}
        <rect fill="#005BBB" width="40" height="20" />
        {/* Yellow bottom half */}
        <rect fill="#FFD500" y="20" width="40" height="20" />
      </g>
    </svg>
  )

  const FlagComponent = locale === 'en' ? USFlag : UkraineFlag
  const OtherFlagComponent = locale === 'en' ? UkraineFlag : USFlag
  const otherLocale: Locale = locale === 'en' ? 'uk' : 'en'

  const isHomepage = pathname === '/'

  const handleLogoClick = (targetLocale: Locale) => {
    if (isHomepage) {
      // On homepage, just switch language
      switchLocale(targetLocale)
    } else {
      // On other pages, navigate to homepage in that language
      router.push('/', { locale: targetLocale })
    }
  }

  const handleIconClick = () => {
    // Navigate to homepage in current locale
    router.push('/', { locale: locale as Locale })
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
      {/* Top Bar - Navigation */}
      <div className="px-4 lg:px-6 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Menu Button */}
          <div className="flex-1 flex items-center">
            <div
              className="relative"
              ref={navMenuRef}
              onMouseEnter={() => setIsNavMenuOpen(true)}
              onMouseLeave={() => setIsNavMenuOpen(false)}
            >
              <button
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[var(--navy-600)] hover:text-[var(--navy-800)] transition-colors"
                aria-label={t('nav.menu')}
              >
                <div className="relative w-6 h-6">
                  {/* Top line - rotates to form top-left to bottom-right of X */}
                  <span
                    className="absolute left-0 h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      top: isNavMenuOpen ? '11px' : '4px',
                      transform: isNavMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                    }}
                  />
                  {/* Middle line - fades out */}
                  <span
                    className="absolute left-0 top-[11px] h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      opacity: isNavMenuOpen ? 0 : 1,
                      transform: isNavMenuOpen ? 'translateX(-8px)' : 'translateX(0)'
                    }}
                  />
                  {/* Bottom line - rotates to form bottom-left to top-right of X */}
                  <span
                    className="absolute left-0 h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      top: isNavMenuOpen ? '11px' : '18px',
                      transform: isNavMenuOpen ? 'rotate(-45deg)' : 'rotate(0deg)'
                    }}
                  />
                </div>
              </button>

              {/* Navigation Dropdown */}
              <div
                className={`absolute left-0 top-full pt-2 z-50 transition-all duration-200 ease-out ${
                  isNavMenuOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="w-56 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                  <Link
                    href="/projects"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    {t('nav.projects')}
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('nav.aboutUs')}
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {t('nav.contact')}
                  </Link>
                  <Link
                    href="/partner-with-us"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="12" r="5" />
                      <circle cx="15" cy="12" r="5" />
                    </svg>
                    {t('nav.mpp')}
                  </Link>

                  <div className="my-2 border-t border-[var(--cream-300)]" />

                  {isAuthenticated ? (
                    <Link
                      href={dashboardLink}
                      onClick={() => setIsNavMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      {t('nav.dashboard')}
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsNavMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      {t('nav.login')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Center - Logo */}
          <div className="flex flex-col items-center min-w-0">
            <span className="font-logo text-[var(--navy-700)] text-[1.4rem] sm:text-[2.5rem] lg:text-[3rem] leading-tight flex items-center">
              <button
                onClick={() => handleLogoClick('en')}
                className={`${locale === 'en' ? 'font-bold' : 'font-normal'} hover:opacity-70 transition-opacity cursor-pointer`}
              >
                hromada
              </button>
              <button
                onClick={handleIconClick}
                className="cursor-pointer mx-2 self-center group"
                aria-label="Go to homepage"
                style={{ perspective: '100px' }}
              >
                <svg
                  viewBox="0 0 48 30"
                  className="inline-block w-6 h-4 sm:w-8 sm:h-5 lg:w-10 lg:h-6 logo-flip"
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
              </button>
              <button
                onClick={() => handleLogoClick('uk')}
                className={`${locale === 'uk' ? 'font-bold' : 'font-normal'} hover:opacity-70 transition-opacity cursor-pointer`}
              >
                громада
              </button>
            </span>
            <span className="text-[0.6rem] sm:text-xs text-[var(--navy-500)] italic text-center truncate max-w-full">
              {t('nav.headerSubtitle')}
            </span>
          </div>

          {/* Right - Language Switcher */}
          <div className="flex-1 flex items-center justify-end">
            <button
              onClick={() => switchLocale(otherLocale)}
              onMouseEnter={() => setIsLangHovered(true)}
              onMouseLeave={() => setIsLangHovered(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center p-1"
              aria-label={t('nav.language')}
              title={otherLocale === 'uk' ? 'Українська' : 'English'}
              style={{ perspective: '100px' }}
            >
              <div
                className="relative w-full h-full transition-transform duration-500 ease-in-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isLangHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
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
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <OtherFlagComponent className="w-full h-full" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Filter Bar */}
      {children}
    </header>
  )
}
