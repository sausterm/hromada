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
          {/* Copyright Notice */}
          <p className="text-sm text-[var(--navy-500)] mb-3">
            © {currentYear} Hromada. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex justify-center gap-6 text-sm flex-wrap">
            <Link
              href="/about"
              className="text-[var(--navy-500)] hover:text-[var(--ukraine-blue)] transition-colors"
            >
              {t('aboutUs')}
            </Link>
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
              href="/contact"
              className="text-[var(--navy-500)] hover:text-[var(--ukraine-blue)] transition-colors"
            >
              {t('contact')}
            </Link>
          </div>

          {/* Built with love message */}
          <p className="text-xs text-[var(--navy-400)] mt-4">
            {t('builtFor')}
          </p>
        </div>
      </div>
    </footer>
  )
}
