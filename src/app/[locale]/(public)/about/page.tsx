'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

export default function AboutPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          {t('about.title')}
        </h1>

        <div className="text-[var(--navy-600)] space-y-8">
          <p className="text-xl leading-relaxed text-[var(--navy-500)]">
            {t('about.mission')}
          </p>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.statementOfPurpose')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('about.statementOfPurposeText')}
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.howItWorks')}
            </h2>
            <p className="text-base leading-relaxed mb-4">{t('about.howItWorksText')}</p>
            <ul className="space-y-3 text-base leading-relaxed">
              <li>
                <strong>{t('about.forMunicipalities')}</strong> {t('about.forMunicipalitiesText')}
              </li>
              <li>
                <strong>{t('about.forDonors')}</strong> {t('about.forDonorsText')}
              </li>
              <li>
                <strong>{t('about.directConnection')}</strong> {t('about.directConnectionText')}
              </li>
            </ul>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.projectCategories')}
            </h2>
            <p className="text-base leading-relaxed mb-4 font-medium">
              {t('about.categoryIntro')}
            </p>
            <ul className="space-y-3 text-base leading-relaxed">
              <li><strong>{t('categories.HOSPITAL')}</strong> - {t('about.categoryHospital')}</li>
              <li><strong>{t('categories.SCHOOL')}</strong> - {t('about.categorySchool')}</li>
              <li><strong>{t('categories.WATER')}</strong> - {t('about.categoryWater')}</li>
              <li><strong>{t('categories.ENERGY')}</strong> - {t('about.categoryEnergy')}</li>
              <li><strong>{t('categories.OTHER')}</strong> - {t('about.categoryOther')}</li>
            </ul>
            <p className="text-sm text-[var(--navy-500)] mt-4 italic">
              {t('about.civilianOnly')}
            </p>
          </section>

        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              {t('about.browseProjects')}
            </Button>
          </Link>
          <Link href="/submit-project">
            <Button variant="outline">
              {t('nav.submitProject')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
