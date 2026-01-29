'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function TermsPage() {
  const t = useTranslations('legal')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--navy-700)] mb-6">
          {t('termsTitle')}
        </h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-[var(--navy-600)]">
            {t('termsComingSoon')}
          </p>
          <p className="mt-4 text-[var(--navy-600)]">
            For questions, contact:{' '}
            <a href="mailto:support@hromada.org" className="text-[var(--navy-700)] underline">
              support@hromada.org
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
