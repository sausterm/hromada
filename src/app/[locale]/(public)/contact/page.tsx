'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'

export default function ContactPage() {
  const t = useTranslations('contact')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-[var(--navy-700)] mb-6">
          {t('title')}
        </h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-[var(--navy-600)] mb-6">
            {t('description')}
          </p>

          <div className="bg-[var(--cream-100)] p-6 rounded-lg border border-[var(--cream-300)]">
            <h3 className="font-semibold text-[var(--navy-700)] mb-2">{t('forMunicipalities')}</h3>
            <p className="text-[var(--navy-600)]">
              {t('forMunicipalitiesText')}
            </p>
          </div>

          <div className="bg-[var(--cream-100)] p-6 rounded-lg mt-4 border border-[var(--cream-300)]">
            <h3 className="font-semibold text-[var(--navy-700)] mb-2">{t('forDonors')}</h3>
            <p className="text-[var(--navy-600)]">
              {t('forDonorsText')}
            </p>
          </div>

          <div className="bg-[var(--cream-100)] p-6 rounded-lg mt-4 border border-[var(--cream-300)]">
            <h3 className="font-semibold text-[var(--navy-700)] mb-2">{t('generalInquiries')}</h3>
            <p className="text-[var(--navy-600)]">
              {t('generalInquiriesText')}{' '}
              <a
                href="mailto:admin@hromadaproject.org"
                className="text-[var(--ukraine-blue)] hover:underline font-medium"
              >
                admin@hromadaproject.org
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
