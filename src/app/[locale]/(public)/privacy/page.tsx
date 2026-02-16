'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function PrivacyPage() {
  const t = useTranslations('legal')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-6">
          {t('privacyTitle')}
        </h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-[var(--navy-600)]">
            {t('privacyComingSoon')}
          </p>
        </div>
      </main>
    </div>
  )
}
