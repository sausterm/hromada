'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'

export default function TransparencyPage() {
  const t = useTranslations()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-2">
          {t('transparency.title')}
        </h1>
        <p className="text-sm text-[var(--navy-400)] mb-10">
          {t('transparency.intro')}
        </p>

        <div className="space-y-10 text-[var(--navy-600)] text-[15px] leading-relaxed">

          {/* 1. Civilian Infrastructure Only */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.civilianOnlyTitle')}
            </h2>
            <p>{t('transparency.civilianOnlyText')}</p>
          </section>

          {/* 2. How Projects Reach the Platform */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.processTitle')}
            </h2>
            <ol className="list-decimal pl-5 space-y-1.5 mt-2">
              <li><strong>{t('transparency.processStep1Title')}.</strong> {t('transparency.processStep1Text')}</li>
              <li><strong>{t('transparency.processStep2Title')}.</strong> {t('transparency.processStep2Text')}</li>
              <li><strong>{t('transparency.processStep3Title')}.</strong> {t('transparency.processStep3Text')}</li>
              <li><strong>{t('transparency.processStep4Title')}.</strong> {t('transparency.processStep4Text')}</li>
              <li><strong>{t('transparency.processStep5Title')}.</strong> {t('transparency.processStep5Text')}</li>
            </ol>
          </section>

          {/* 3. Project Verification */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.verificationTitle')}
            </h2>
            <p>{t('transparency.verificationText')}</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-4">
              <li><strong>{t('prescreening.ngoPartnerTitle')}.</strong> {t('prescreening.ngoPartnerDesc')}</li>
              <li><strong>{t('prescreening.documentationTitle')}.</strong> {t('prescreening.documentationDesc')}</li>
              <li><strong>{t('prescreening.bankingTitle')}.</strong> {t('prescreening.bankingDesc')}</li>
              <li><strong>{t('prescreening.ofacTitle')}.</strong> {t('prescreening.ofacDesc')}</li>
            </ul>
          </section>

          {/* 4. Direct Connection */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.directConnectionTitle')}
            </h2>
            <p>{t('transparency.directConnectionText')}</p>
          </section>

          {/* 5. Municipal Governance Data */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.governanceDataTitle')}
            </h2>
            <p>{t('transparency.governanceDataText')}</p>
            <p className="mt-2">
              <a
                href="https://transparentcities.in.ua/en/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ukraine-blue)] hover:underline"
              >
                {t('prescreening.visitTransparentCities')}
              </a>
            </p>
          </section>

          {/* 6. FAQs */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('transparency.faqTitle')}
            </h2>
            <div className="space-y-2 mt-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="border border-[var(--cream-300)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === n ? null : n)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-[var(--navy-700)] font-medium text-[15px] hover:bg-[var(--cream-50)] transition-colors cursor-pointer"
                  >
                    {t(`transparency.faq${n}Question`)}
                    <svg
                      className={`w-5 h-5 text-[var(--navy-400)] flex-shrink-0 ml-2 transition-transform duration-200 ${openFaq === n ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${openFaq === n ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-4 pb-3 text-[var(--navy-600)] text-[15px] leading-relaxed">
                        {t(`transparency.faq${n}Answer`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Legal & Policies */}
          <section className="fade-in-section">
            <h2 className="font-logo text-xl font-semibold tracking-tight text-[var(--navy-700)] mb-3">
              {t('prescreening.policiesTitle')}
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                <Link href="/terms" className="text-[var(--ukraine-blue)] hover:underline">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/ofac-policy" className="text-[var(--ukraine-blue)] hover:underline">
                  {t('prescreening.sanctionsPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[var(--ukraine-blue)] hover:underline">
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </section>

        </div>
      </main>
    </div>
  )
}
