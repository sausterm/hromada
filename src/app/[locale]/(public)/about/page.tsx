'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo.png', url: 'https://en.ecoaction.org.ua/' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo.png', url: 'https://ecoclubrivne.org/en/' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo.png', url: 'https://repowerua.org/' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo.png', url: 'https://www.greenpeace.org/ukraine/en/' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo.png', url: 'https://www.energyactua.com/' },
]

export default function AboutPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-100)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-4 text-center">
          {t('about.title')}
        </h1>

        <div className="text-[var(--navy-600)]">
          {/* Mission intro */}
          <p className="text-xl leading-relaxed text-[var(--navy-500)] mb-6 text-center">
            {t('about.mission')}
          </p>

          {/* 1. Statement of Purpose */}
          <section className="mb-12">
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('about.statementOfPurpose')}
            </h2>
            <blockquote className="text-lg leading-relaxed text-[var(--navy-600)] italic text-center border-l-4 border-r-4 border-[var(--ukraine-500)] px-6 py-2 mx-auto max-w-2xl">
              {t('about.statementOfPurposeText')}
            </blockquote>
          </section>

          <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

          {/* 2. Our Partners */}
          <section className="mb-12">
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-3 text-center">
              {t('transparency.partnersTitle')}
            </h2>
            <p className="text-base leading-relaxed mb-6 text-center">
              {t('transparency.partnersText')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {partners.map((partner) => (
                <a
                  key={partner.name}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-70 hover:opacity-100 transition-opacity"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 w-auto object-contain"
                  />
                </a>
              ))}
            </div>
          </section>

          {/* Trust Center */}
          <div className="flex justify-center">
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
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <Link href="/">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              {t('about.browseProjects')}
            </Button>
          </Link>
          <Link href="/submit-project">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              {t('nav.submitProject')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
