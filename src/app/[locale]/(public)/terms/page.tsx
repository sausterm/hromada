'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function TermsPage() {
  const t = useTranslations('legal')

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-2">
          {t('termsTitle')}
        </h1>
        <p className="text-sm text-[var(--navy-400)] mb-10">Effective Date: February 23, 2026</p>

        <div className="space-y-10 text-[var(--navy-600)] text-[15px] leading-relaxed">
          <p>{t('termsComingSoon')}</p>
        </div>
      </main>
    </div>
  )
}
