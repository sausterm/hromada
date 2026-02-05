'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function ContactPage() {
  const t = useTranslations('contact')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold text-[var(--navy-700)] mb-3">
          {t('title')}
        </h1>
        <p className="text-[var(--navy-600)] mb-6">
          {t('description')}
        </p>
        <div className="bg-[var(--cream-100)] p-6 rounded-xl border border-[var(--cream-300)]">
          <p className="text-[var(--navy-600)]">
            {t('generalInquiriesText')}{' '}
            <a
              href="mailto:thomas@hromadaproject.org"
              className="text-[var(--ukraine-blue)] hover:underline font-medium"
            >
              thomas@hromadaproject.org
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
