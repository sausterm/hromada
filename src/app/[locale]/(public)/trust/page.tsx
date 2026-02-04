'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

export default function TrustPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          {t('trust.title')}
        </h1>

        <div className="text-[var(--navy-600)] space-y-8">
          <p className="text-xl leading-relaxed text-[var(--navy-500)]">
            {t('trust.intro')}
          </p>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('trust.verificationTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('trust.verificationText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('trust.transparencyTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('trust.transparencyText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('trust.partnersTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('trust.partnersText')}
            </p>
          </section>
        </div>

        <div className="mt-12">
          <Link href="/">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              {t('about.browseProjects')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
