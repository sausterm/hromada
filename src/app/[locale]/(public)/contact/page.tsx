'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

export default function ContactPage() {
  const t = useTranslations('contact')

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-3">
          {t('title')}
        </h1>
        <p className="text-xl text-[var(--navy-500)] mb-2">
          {t('description')}
        </p>
        <p className="text-sm text-[var(--navy-400)] mb-12">
          {t('responseTime')}
        </p>

        <div className="space-y-10">
          {/* For Municipalities */}
          <section className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--navy-100)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-1">
                {t('forMunicipalities')}
              </h2>
              <p className="text-[var(--navy-600)] mb-3">
                {t('forMunicipalitiesText')}
              </p>
              <Link href="/submit-project" className="inline-flex items-center gap-1 text-[var(--navy-700)] font-medium hover:text-[var(--navy-900)] transition-colors">
                {t('forMunicipalitiesAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          <hr className="border-[var(--cream-300)]" />

          {/* For Donors */}
          <section className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#7B9E6B20] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#5A7D4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-1">
                {t('forDonors')}
              </h2>
              <p className="text-[var(--navy-600)] mb-3">
                {t('forDonorsText')}
              </p>
              <Link href="/" className="inline-flex items-center gap-1 text-[var(--navy-700)] font-medium hover:text-[var(--navy-900)] transition-colors">
                {t('forDonorsAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          <hr className="border-[var(--cream-300)]" />

          {/* For NGO Partners */}
          <section className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--cream-200)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-1">
                {t('forPartners')}
              </h2>
              <p className="text-[var(--navy-600)] mb-3">
                {t('forPartnersText')}
              </p>
              <a href="mailto:thomas@hromadaproject.org?subject=Partnership%20Inquiry" className="inline-flex items-center gap-1 text-[var(--navy-700)] font-medium hover:text-[var(--navy-900)] transition-colors">
                {t('forPartnersAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          <hr className="border-[var(--cream-300)]" />

          {/* Media & Press */}
          <section className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-1">
                {t('forMedia')}
              </h2>
              <p className="text-[var(--navy-600)] mb-3">
                {t('forMediaText')}
              </p>
              <a href="mailto:thomas@hromadaproject.org?subject=Media%20Inquiry" className="inline-flex items-center gap-1 text-[var(--navy-700)] font-medium hover:text-[var(--navy-900)] transition-colors">
                {t('forMediaAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          <hr className="border-[var(--cream-300)]" />

          {/* General Inquiries */}
          <section className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--cream-200)] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--navy-700)] mb-1">
                {t('generalInquiries')}
              </h2>
              <p className="text-[var(--navy-600)] mb-3">
                {t('generalInquiriesText')}
              </p>
              <a
                href="mailto:thomas@hromadaproject.org"
                className="inline-flex items-center gap-2 text-[var(--ukraine-blue)] hover:underline font-medium"
              >
                thomas@hromadaproject.org
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
