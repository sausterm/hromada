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
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setIsNavMenuOpen(false)
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
    }

    if (isNavMenuOpen || isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNavMenuOpen, isLangMenuOpen])

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
    setIsLangMenuOpen(false)
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
                    href="/admin"
                    onClick={() => setIsNavMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--navy-600)] hover:bg-[var(--cream-100)] transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('nav.admin')}
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
                    100% { transform: rotate(-38deg) rotateY(-360deg); }
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
            <div
              className="relative"
              ref={langMenuRef}
              onMouseEnter={() => setIsLangMenuOpen(true)}
              onMouseLeave={() => setIsLangMenuOpen(false)}
            >
              <button
                className="w-8 h-8 rounded-full bg-white border border-[var(--cream-400)] hover:border-[var(--navy-400)] transition-colors flex items-center justify-center p-0.5"
                aria-label={t('nav.language')}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <FlagComponent className="w-full h-full" />
                </div>
              </button>

              {/* Language Dropdown */}
              {isLangMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
                  <div className="rounded-lg bg-white shadow-lg border border-[var(--cream-300)] p-1.5">
                    <button
                      onClick={() => switchLocale(otherLocale)}
                      className="w-8 h-8 rounded-full bg-white border border-[var(--cream-400)] hover:border-[var(--navy-400)] transition-colors flex items-center justify-center p-0.5"
                      title={otherLocale === 'uk' ? 'Українська' : 'English'}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden">
                        <OtherFlagComponent className="w-full h-full" />
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optional Filter Bar */}
      {children}
    </header>
  )
}
