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

        <div className="prose prose-lg text-[var(--navy-600)] space-y-6">
          <p className="text-xl text-[var(--navy-500)]">
            {t('about.mission')}
          </p>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              Our Mission
            </h2>
            <p>
              The word "hromada" (громада) means "community" in Ukrainian. Our platform serves as a bridge
              between Ukrainian municipalities seeking support for critical infrastructure projects and
              donors who want to make a direct, meaningful impact.
            </p>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.howItWorks')}
            </h2>
            <p className="mb-4">{t('about.howItWorksText')}</p>
            <ul className="space-y-3">
              <li>
                <strong>For Municipalities:</strong> Ukrainian community leaders submit their infrastructure
                projects through our platform. Each project is reviewed before being published.
              </li>
              <li>
                <strong>For Donors:</strong> Browse verified projects, filter by category, urgency, or
                location, and connect directly with communities to provide support.
              </li>
              <li>
                <strong>Direct Connection:</strong> We facilitate introductions but do not process payments.
                Donors work directly with municipalities to ensure transparency and accountability.
              </li>
            </ul>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              Project Categories
            </h2>
            <ul className="space-y-2">
              <li><strong>{t('categories.HOSPITAL')}</strong> - Healthcare infrastructure and equipment</li>
              <li><strong>{t('categories.SCHOOL')}</strong> - Educational facilities and resources</li>
              <li><strong>{t('categories.WATER')}</strong> - Clean water and sanitation systems</li>
              <li><strong>{t('categories.ENERGY')}</strong> - Solar panels, heat pumps, and power systems</li>
              <li><strong>{t('categories.OTHER')}</strong> - Community buildings and essential services</li>
            </ul>
          </section>

          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.contact')}
            </h2>
            <p>
              Questions or feedback? Reach out to us at{' '}
              <a href="mailto:support@hromada.org" className="text-[var(--navy-700)] underline">
                support@hromada.org
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/">
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)]">
              Browse Projects
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
