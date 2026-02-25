'use client'

import { useTranslations } from 'next-intl'
import { DocumentaryPhoto } from '@/components/homepage/DocumentaryPhoto'
import { TimelineEvent } from '@/components/homepage/TimelineEvent'

export function CaseStudySection() {
  const t = useTranslations()

  return (
    <section className="fade-in-section pt-4 pb-16 md:pt-8 md:pb-24 bg-[var(--cream-100)]">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-[var(--ukraine-blue)] text-sm font-medium mb-4">
            <div className="w-8 h-px bg-current" />
            {t('homepage.caseStudy.label')}
            <div className="w-8 h-px bg-current" />
          </div>
          <h2 className="font-logo text-3xl md:text-4xl font-semibold tracking-tight text-[var(--navy-700)] mb-4">
            {t('homepage.caseStudy.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <DocumentaryPhoto
              src="https://images.unsplash.com/photo-1613896527026-f195d5c818ed?w=1200&q=80"
              alt="Solar panels installed on school rooftop"
              caption={t('homepage.caseStudy.photoCaption1')}
              location="Novohrodivka, Donetsk Oblast"
            />
          </div>

          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block bg-[#7B9E6B] text-white text-xs px-2 py-1 rounded-full">
                  {t('homepage.caseStudy.badge')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--navy-500)]">
                  {t('homepage.caseStudy.partnerLabel')}:
                  <img src="/partners/EcoactionLogo.png" alt="Ecoaction" className="h-4 w-auto" />
                  <strong className="text-[var(--navy-700)]">{t('homepage.caseStudy.partnerName')}</strong>
                </span>
              </div>
              <h3 className="text-2xl font-bold text-[var(--navy-700)] mb-2">
                {t('homepage.caseStudy.projectName')}
              </h3>
              <p className="text-[var(--navy-500)]">
                {t('homepage.caseStudy.projectDesc')}
              </p>
            </div>

            <div className="mt-8">
              <TimelineEvent date={t('homepage.caseStudy.timeline1Date')} title={t('homepage.caseStudy.timeline1Title')} description={t('homepage.caseStudy.timeline1Desc')} />
              <TimelineEvent date={t('homepage.caseStudy.timeline2Date')} title={t('homepage.caseStudy.timeline2Title')} description={t('homepage.caseStudy.timeline2Desc')} />
              <TimelineEvent date={t('homepage.caseStudy.timeline3Date')} title={t('homepage.caseStudy.timeline3Title')} description={t('homepage.caseStudy.timeline3Desc')} />
              <TimelineEvent date={t('homepage.caseStudy.timeline4Date')} title={t('homepage.caseStudy.timeline4Title')} description={t('homepage.caseStudy.timeline4Desc')} />
              <TimelineEvent date={t('homepage.caseStudy.timeline5Date')} title={t('homepage.caseStudy.timeline5Title')} description={t('homepage.caseStudy.timeline5Desc')} isComplete={true} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <DocumentaryPhoto
            src="https://images.unsplash.com/photo-1594608661623-aa0bd3a69d98?w=1200&q=80"
            alt="Solar panels on school rooftop"
            caption={t('homepage.caseStudy.photoCaption2')}
            location="Novohrodivka"
          />
          <DocumentaryPhoto
            src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80"
            alt="School interior classroom"
            caption={t('homepage.caseStudy.photoCaption3')}
            location="Donetsk Oblast"
          />
          <div className="flex flex-col justify-center">
            <ImpactCard />
          </div>
        </div>
      </div>
    </section>
  )
}

function ImpactCard() {
  const t = useTranslations()

  const stats = [
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', label: t('homepage.caseStudy.impactPower') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />, bgColor: 'bg-blue-100', textColor: 'text-blue-600', label: t('homepage.caseStudy.impactPanels') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, bgColor: 'bg-green-100', textColor: 'text-green-600', label: t('homepage.caseStudy.impactCost') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />, bgColor: 'bg-purple-100', textColor: 'text-purple-600', label: t('homepage.caseStudy.impactBeneficiaries') },
  ]

  return (
    <div className="bg-white rounded-xl border border-[var(--cream-200)] overflow-hidden shadow-sm">
      <div className="bg-[var(--cream-50)] px-4 py-3 border-b border-[var(--cream-200)]">
        <span className="text-sm font-medium text-[var(--navy-700)]">{t('homepage.caseStudy.impactTitle')}</span>
      </div>
      <div className="p-4 space-y-3">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-4 h-4 ${stat.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{stat.icon}</svg>
            </div>
            <span className="text-sm font-medium text-[var(--navy-700)]">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
