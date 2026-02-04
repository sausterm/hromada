'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

export default function TransparencyPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          {t('transparency.title')}
        </h1>

        <div className="text-[var(--navy-600)] space-y-8">
          <p className="text-xl leading-relaxed text-[var(--navy-500)]">
            {t('transparency.intro')}
          </p>

          <a
            href="https://app.sprinto.com/trust-center/view/ef845d19-d94b-4d73-84d9-18fa1945b999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--navy-700)] text-[var(--cream-100)] font-medium rounded-lg hover:bg-[var(--navy-800)] transition-colors"
          >
            {t('transparency.visitTrustCenter')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <section className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18v-7" />
                <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" />
                <path d="M14 18v-7" />
                <path d="M18 18v-7" />
                <path d="M3 22h18" />
                <path d="M6 18v-7" />
              </svg>
              {t('transparency.civilianOnlyTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('transparency.civilianOnlyText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('transparency.verificationTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('transparency.verificationText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('transparency.directConnectionTitle')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('transparency.directConnectionText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('transparency.partnersTitle')}
            </h2>
            <p className="text-base leading-relaxed mb-4">
              {t('transparency.partnersText')}
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://en.ecoaction.org.ua/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy-600)] hover:text-[var(--navy-800)] underline underline-offset-2"
                >
                  NGO Ecoaction
                </a>
              </li>
              <li>
                <a
                  href="https://ecoclubrivne.org/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy-600)] hover:text-[var(--navy-800)] underline underline-offset-2"
                >
                  NGO Ecoclub
                </a>
              </li>
              <li>
                <a
                  href="https://www.energyactua.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy-600)] hover:text-[var(--navy-800)] underline underline-offset-2"
                >
                  Energy Act For Ukraine
                </a>
              </li>
              <li>
                <a
                  href="https://repowerua.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy-600)] hover:text-[var(--navy-800)] underline underline-offset-2"
                >
                  RePower Ukraine
                </a>
              </li>
              <li>
                <a
                  href="https://www.greenpeace.org/ukraine/en/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy-600)] hover:text-[var(--navy-800)] underline underline-offset-2"
                >
                  Greenpeace Ukraine
                </a>
              </li>
            </ul>
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
