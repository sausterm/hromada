'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--cream-100)] border-t border-[var(--cream-300)] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          {/* Fiscal sponsor */}
          <p className="text-sm text-[var(--navy-500)] mb-3">
            {t('fiscalSponsor')}{' '}
            <a href="https://pocacito.org" target="_blank" rel="noopener noreferrer" className="text-[var(--navy-600)] hover:text-[var(--ukraine-blue)] underline transition-colors">
              POCACITO Network
            </a>
            <span className="hidden sm:inline">{' · '}</span>
            <br className="sm:hidden" />
            <a href="https://app.candid.org/profile/16026326/pocacito-network/" target="_blank" rel="noopener noreferrer" className="text-[var(--navy-600)] hover:text-[var(--ukraine-blue)] underline transition-colors">
              {t('candidSeal')}
            </a>
          </p>

          {/* Links */}
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <Link
              href="/terms"
              className="text-[var(--navy-500)] hover:text-[var(--ukraine-blue)] transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              href="/privacy"
              className="text-[var(--navy-500)] hover:text-[var(--ukraine-blue)] transition-colors"
            >
              {t('privacy')}
            </Link>
            <Link
              href="/ofac-policy"
              className="text-[var(--navy-500)] hover:text-[var(--ukraine-blue)] transition-colors"
            >
              Sanctions Policy
            </Link>
          </div>

          {/* Copyright Notice */}
          <p className="text-sm text-[var(--navy-500)] mt-3">
            {t('copyright', { year: currentYear })}
          </p>        </div>
      </div>
    </footer>
  )
}
