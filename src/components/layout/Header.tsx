'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { locales, type Locale } from '@/i18n'

interface HeaderProps {
  children?: React.ReactNode // For filter bar content
}

export function Header({ children }: HeaderProps) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false)
  const [isLangHovered, setIsLangHovered] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

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
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[var(--navy-600)] hover:bg-[var(--navy-50)] hover:text-[var(--navy-800)] transition-colors"
                aria-label={t('nav.menu')}
              >
                {isNavMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Navigation Dropdown */}
              {isNavMenuOpen && (
                <div className="absolute left-0 top-full pt-2 z-50">
                  <div className="w-56 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-2">
                  <Link
                    href="/"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {t('nav.home')}
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
                    href="/transparency"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t('nav.transparency')}
                  </Link>
                  <Link
                    href="/submit-project"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('nav.submitProject')}
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

                  <div className="my-2 border-t border-[var(--cream-300)]" />

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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center - Logo */}
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="font-logo text-[var(--navy-700)] text-[2rem] sm:text-[2.5rem] lg:text-[3rem] leading-tight flex items-center">
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
            <span className="text-[0.7rem] sm:text-xs text-[var(--navy-500)] italic">
              {t('nav.headerSubtitle')}
            </span>
          </div>

          {/* Right - Language Switcher */}
          <div className="flex-1 flex items-center justify-end">
            <button
              onClick={() => switchLocale(otherLocale)}
              onMouseEnter={() => setIsLangHovered(true)}
              onMouseLeave={() => setIsLangHovered(false)}
              className="w-8 h-8 rounded-full bg-white border border-[var(--cream-400)] hover:border-[var(--navy-400)] transition-colors flex items-center justify-center p-0.5 group"
              aria-label={t('nav.language')}
              title={otherLocale === 'uk' ? 'Українська' : 'English'}
              style={{ perspective: '100px' }}
            >
              <div
                className="w-full h-full rounded-full overflow-hidden transition-transform duration-300"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isLangHovered ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                <div className="absolute inset-0 backface-hidden">
                  <FlagComponent className="w-full h-full" />
                </div>
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <OtherFlagComponent className="w-full h-full" />
                </div>
              </div>
              <style jsx>{`
                .backface-hidden {
                  backface-visibility: hidden;
                  -webkit-backface-visibility: hidden;
                }
              `}</style>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Filter Bar */}
      {children}
    </header>
  )
}
