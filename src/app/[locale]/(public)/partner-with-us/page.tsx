'use client'

import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { PartnershipInterestForm } from '@/components/forms/PartnershipInterestForm'
import { type Category, CATEGORY_CONFIG } from '@/types'

const HOW_IT_WORKS_STEPS = [
  { key: 'step1', color: '#5B8FA8' },
  { key: 'step2', color: '#7B9E6B' },
  { key: 'step3', color: '#D4954A' },
  { key: 'step4', color: '#C75B39' },
  { key: 'step5', color: '#8B7355' },
]

const WHY_IT_WORKS = [
  {
    key: 'achievable',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'collective',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    key: 'concrete',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'bridges',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const COMMUNITY_TYPES = [
  { key: 'rotary', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { key: 'cityCouncil', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'faith', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { key: 'school', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0v6' },
  { key: 'diaspora', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'corporate', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'other', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
]

export default function PartnerWithUsPage() {
  const t = useTranslations('partnership')

  function scrollToForm() {
    document.getElementById('interest-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cream-100)]">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        {/* Hero */}
        <h1 className="font-logo text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4 text-center">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-[var(--navy-500)] mb-4 text-center">
          {t('hero.subtitle')}
        </p>
        <p className="text-lg text-[var(--navy-500)] mb-8 text-center">
          {t('hero.pitch')}
        </p>
        <div className="text-center mb-12">
          <Button variant="primary" size="lg" onClick={scrollToForm}>
            {t('hero.cta')}
          </Button>
        </div>

        <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-8 text-center">
            {t('howItWorks.title')}
          </h2>
          <div className="space-y-6 max-w-2xl mx-auto">
            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: step.color }}
                >
                  {i + 1}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-bold text-[var(--navy-700)]">{t(`howItWorks.${step.key}Title`)}</h3>
                  <p className="text-sm text-[var(--navy-500)] mt-0.5">{t(`howItWorks.${step.key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

        {/* Why It Works */}
        <section className="mb-12">
          <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-8 text-center">
            {t('whyItWorks.title')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {WHY_IT_WORKS.map((item) => (
              <div key={item.key} className="bg-white rounded-xl border border-[var(--cream-200)] p-6">
                <div className="w-10 h-10 rounded-full bg-[var(--cream-100)] flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-[var(--navy-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <h3 className="font-bold text-[var(--navy-700)] mb-1">{t(`whyItWorks.${item.key}Title`)}</h3>
                <p className="text-sm text-[var(--navy-500)]">{t(`whyItWorks.${item.key}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

        {/* Who Participates */}
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-3 text-center">
            {t('whoParticipates.title')}
          </h2>
          <p className="text-[var(--navy-500)] mb-8">{t('whoParticipates.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {COMMUNITY_TYPES.map((ct) => (
              <div key={ct.key} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[var(--cream-200)] text-sm text-[var(--navy-600)]">
                <svg className="w-4 h-4 text-[var(--navy-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ct.icon} />
                </svg>
                {t(`whoParticipates.${ct.key}`)}
              </div>
            ))}
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

        {/* What Gets Funded */}
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-3 text-center">
            {t('whatGetsFunded.title')}
          </h2>
          <p className="text-[var(--navy-500)] mb-8">{t('whatGetsFunded.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {(Object.keys(CATEGORY_CONFIG) as Category[]).map((category) => {
              const config = CATEGORY_CONFIG[category]
              return (
                <div
                  key={category}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${config.color}15`,
                    color: config.color,
                    border: `1px solid ${config.color}30`,
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: config.icon }}
                  />
                  {config.label}
                </div>
              )
            })}
          </div>
        </section>

        <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

        {/* Interest Form */}
        <section id="interest-form" className="mb-12">
          <h2 className="text-3xl font-medium text-[var(--navy-700)] text-center mb-3">
            {t('form.title')}
          </h2>
          <p className="text-[var(--navy-500)] text-center mb-8">{t('form.subtitle')}</p>
          <PartnershipInterestForm />
        </section>
      </main>
    </div>
  )
}
