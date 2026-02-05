'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function ContactPage() {
  const t = useTranslations('contact')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full">
          <div className="bg-[var(--cream-100)] p-10 rounded-2xl border border-[var(--cream-300)] text-center shadow-sm">
            <h1 className="text-3xl font-bold text-[var(--navy-700)] mb-4">
              {t('title')}
            </h1>
            <p className="text-lg text-[var(--navy-600)] mb-8">
              {t('description')}
            </p>
            <a
              href="mailto:thomas@hromadaproject.org"
              className="inline-flex items-center gap-2 text-xl font-medium text-[var(--ukraine-blue)] hover:underline"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              thomas@hromadaproject.org
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
