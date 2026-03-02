'use client'

import { useTranslations } from 'next-intl'
import { DocumentaryPhoto } from '@/components/homepage/DocumentaryPhoto'
import { TimelineEvent } from '@/components/homepage/TimelineEvent'

export function CaseStudySection() {
  const t = useTranslations()

  return (
    <section className="fade-in-section py-16 md:py-24 bg-[var(--cream-100)]">
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
              src="/projects/horenka-roof-array.webp"
              alt="Full solar array covering the Horenka hospital roof"
              caption={t('homepage.caseStudy.photoCaption2')}
              credit="Oleksandr Popenko / Greenpeace"
              location="Horenka, Kyiv Oblast"
            />
          </div>

          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-block bg-[#C75B39] text-white text-xs px-2 py-1 rounded-full">
                  {t('homepage.caseStudy.badge')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--navy-500)]">
                  {t('homepage.caseStudy.partnerLabel')}:
                  <img src="/partners/EcoactionLogo.png" alt="Ecoaction" className="h-4 w-auto" />
                  <img src="/partners/EcoclubLogo.png" alt="Ecoclub" className="h-4 w-auto" />
                  <img src="/partners/greenpeacelogo.png" alt="Greenpeace" className="h-4 w-auto" />
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

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <DocumentaryPhoto
            src="/projects/horenka-solar-install.jpeg"
            alt="Workers installing solar panels on Horenka hospital roof"
            caption={t('homepage.caseStudy.photoCaption1')}
            location="Horenka"
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
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />, bgColor: 'bg-orange-100', textColor: 'text-orange-600', label: t('homepage.caseStudy.impactHeating') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', label: t('homepage.caseStudy.impactElectricity') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, bgColor: 'bg-green-100', textColor: 'text-green-600', label: t('homepage.caseStudy.impactCost') },
    { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />, bgColor: 'bg-blue-100', textColor: 'text-blue-600', label: t('homepage.caseStudy.impactPayback') },
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
