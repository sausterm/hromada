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
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
    }

    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLangMenuOpen])

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
    setIsLangMenuOpen(false)
  }

  const languageLabels: Record<Locale, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇺🇸' },
    uk: { name: 'Українська', flag: '🇺🇦' },
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--cream-100)] border-b border-[var(--cream-300)] shadow-sm">
      {/* Top Bar - Navigation */}
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Admin */}
          <div className="flex-1">
            <Link href="/admin" className="hidden sm:inline-block">
              <Button variant="ghost" size="md">
                {t('nav.admin')}
              </Button>
            </Link>
          </div>

          {/* Center - Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 transition-opacity hover:opacity-80"
          >
            <span className="font-logo text-[var(--navy-700)] text-2xl sm:text-[1.75rem] lg:text-[2.125rem]">
              {t('nav.siteName')}
            </span>
          </Link>

          {/* Right - Language, About & Submit */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {/* Language Switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-[var(--cream-300)] text-[var(--navy-600)] hover:border-[var(--navy-300)] hover:bg-[var(--navy-50)] transition-colors"
                aria-label={t('nav.language')}
              >
                <span>{languageLabels[locale as Locale].flag}</span>
                <span className="hidden sm:inline">{locale.toUpperCase()}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Language Dropdown */}
              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-white shadow-lg border border-[var(--cream-300)] py-1 z-50">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        locale === loc
                          ? 'bg-[var(--navy-50)] text-[var(--navy-700)] font-medium'
                          : 'text-[var(--navy-600)] hover:bg-[var(--cream-100)]'
                      }`}
                    >
                      <span>{languageLabels[loc].flag}</span>
                      <span>{languageLabels[loc].name}</span>
                      {locale === loc && (
                        <svg className="h-4 w-4 ml-auto text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/about" className="hidden sm:inline-block">
              <Button variant="ghost" size="md">
                {t('nav.aboutUs')}
              </Button>
            </Link>
            <Link href="/submit-project">
              <Button
                variant="primary"
                size="md"
                className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]"
              >
                <span className="hidden sm:inline">{t('nav.submitProject')}</span>
                <span className="sm:hidden">+</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Optional Filter Bar */}
      {children}
    </header>
  )
}
