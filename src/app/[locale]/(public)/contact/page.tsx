'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'

export default function ContactPage() {
  const t = useTranslations('contact')

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-4 text-center">
          {t('title')}
        </h1>
        <p className="text-xl leading-relaxed text-[var(--navy-500)] mb-2 text-center">
          {t('description')}
        </p>
        <p className="text-sm text-[var(--navy-400)] mb-12 text-center">
          {t('responseTime')}
        </p>

        <div className="space-y-12">
          {/* For Municipalities */}
          <section>
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('forMunicipalities')}
            </h2>
            <p className="text-base leading-relaxed text-[var(--navy-600)] text-center">
              {t('forMunicipalitiesText')}
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/submit-project" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--navy-300)] text-[var(--navy-700)] font-medium hover:bg-[var(--navy-700)] hover:text-white hover:border-[var(--navy-700)] transition-all">
                {t('forMunicipalitiesAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          <hr className="border-[var(--cream-300)] w-24 mx-auto" />

          {/* For Donors */}
          <section>
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('forDonors')}
            </h2>
            <p className="text-base leading-relaxed text-[var(--navy-600)] text-center">
              {t('forDonorsText')}
            </p>
            <div className="mt-4 flex justify-center">
              <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--navy-300)] text-[var(--navy-700)] font-medium hover:bg-[var(--navy-700)] hover:text-white hover:border-[var(--navy-700)] transition-all">
                {t('forDonorsAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          <hr className="border-[var(--cream-300)] w-24 mx-auto" />

          {/* For NGO Partners */}
          <section>
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('forPartners')}
            </h2>
            <p className="text-base leading-relaxed text-[var(--navy-600)] text-center">
              {t('forPartnersText')}
            </p>
            <div className="mt-4 flex justify-center">
              <a href="mailto:thomas@hromadaproject.org?subject=Partnership%20Inquiry" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--navy-300)] text-[var(--navy-700)] font-medium hover:bg-[var(--navy-700)] hover:text-white hover:border-[var(--navy-700)] transition-all">
                {t('forPartnersAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          <hr className="border-[var(--cream-300)] w-24 mx-auto" />

          {/* Media & Press */}
          <section>
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('forMedia')}
            </h2>
            <p className="text-base leading-relaxed text-[var(--navy-600)] text-center">
              {t('forMediaText')}
            </p>
            <div className="mt-4 flex justify-center">
              <a href="mailto:thomas@hromadaproject.org?subject=Media%20Inquiry" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--navy-300)] text-[var(--navy-700)] font-medium hover:bg-[var(--navy-700)] hover:text-white hover:border-[var(--navy-700)] transition-all">
                {t('forMediaAction')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>

          <hr className="border-[var(--cream-300)] w-24 mx-auto" />

          {/* General Inquiries */}
          <section>
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('generalInquiries')}
            </h2>
            <p className="text-base leading-relaxed text-[var(--navy-600)] text-center">
              {t('generalInquiriesText')}
            </p>
            <div className="mt-4 flex justify-center">
              <a
                href="mailto:thomas@hromadaproject.org"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--navy-300)] text-[var(--navy-700)] font-medium hover:bg-[var(--navy-700)] hover:text-white hover:border-[var(--navy-700)] transition-all"
              >
                thomas@hromadaproject.org
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
