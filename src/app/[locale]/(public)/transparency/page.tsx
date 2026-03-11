'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'

export default function TransparencyPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-logo text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-2">
          {t('transparency.title')}
        </h1>
        <p className="text-sm text-[var(--navy-500)] mb-10">
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

          {/* 5. Legal & Policies */}
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
