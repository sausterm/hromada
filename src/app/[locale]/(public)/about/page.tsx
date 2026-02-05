'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

const partners = [
  { name: 'Ecoaction', logo: '/partners/EcoactionLogo-white.png', url: 'https://en.ecoaction.org.ua/' },
  { name: 'Ecoclub', logo: '/partners/EcoclubLogo-white.png', url: 'https://ecoclubrivne.org/en/' },
  { name: 'RePower Ukraine', logo: '/partners/RePowerUkraineLogo-white.png', url: 'https://repowerua.org/' },
  { name: 'Greenpeace', logo: '/partners/greenpeacelogo-white.png', url: 'https://www.greenpeace.org/ukraine/en/' },
  { name: 'Energy Act For Ukraine', logo: '/partners/energyactukrainelogo-white.png', url: 'https://www.energyactua.com/' },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [answer])

  return (
    <div className="border-b border-[var(--cream-300)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-[var(--navy-800)] transition-colors"
      >
        <span className="font-medium text-[var(--navy-700)] pr-4">{question}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-[var(--navy-400)] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="pb-4 text-[var(--navy-600)] leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const t = useTranslations()

  const processSteps = [
    { key: '1', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: '2', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: '3', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { key: '4', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { key: '5', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]

  const faqs = [
    { question: t('transparency.faq1Question'), answer: t('transparency.faq1Answer') },
    { question: t('transparency.faq2Question'), answer: t('transparency.faq2Answer') },
    { question: t('transparency.faq3Question'), answer: t('transparency.faq3Answer') },
    { question: t('transparency.faq4Question'), answer: t('transparency.faq4Answer') },
    { question: t('transparency.faq5Question'), answer: t('transparency.faq5Answer') },
  ]

  return (
    <div className="min-h-screen bg-[var(--cream-50)] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-[var(--navy-700)] mb-6">
          {t('about.title')}
        </h1>

        <div className="text-[var(--navy-600)] space-y-8">
          {/* Mission intro */}
          <p className="text-xl leading-relaxed text-[var(--navy-500)]">
            {t('about.mission')}
          </p>

          {/* Trust Center button */}
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

          {/* 1. Statement of Purpose */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('about.statementOfPurpose')}
            </h2>
            <p className="text-base leading-relaxed">
              {t('about.statementOfPurposeText')}
            </p>
          </section>

          {/* 2. Civilian Infrastructure Only */}
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

          {/* 3. How It Works */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)] overflow-hidden">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-8">
              {t('transparency.processTitle')}
            </h2>

            {/* Desktop Flow */}
            <div className="hidden md:block">
              <div className="flex items-start justify-between relative">
                {processSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative z-10">
                    {/* Icon circle */}
                    <div className="w-14 h-14 rounded-full bg-[var(--navy-700)] flex items-center justify-center shadow-lg ring-4 ring-[var(--cream-200)]">
                      <svg className="w-7 h-7 text-[var(--cream-100)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                      </svg>
                    </div>
                    {/* Title */}
                    <span className="text-sm font-semibold text-[var(--navy-700)] mt-3 text-center">
                      {t(`transparency.processStep${step.key}Title`)}
                    </span>
                    {/* Description */}
                    <span className="text-xs text-[var(--navy-500)] text-center mt-1 max-w-[100px] leading-relaxed">
                      {t(`transparency.processStep${step.key}Text`)}
                    </span>
                  </div>
                ))}

                {/* Connecting lines between circles */}
                <div className="absolute top-7 left-0 right-0 h-[2px] pointer-events-none" style={{ zIndex: 0 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute h-[2px] bg-[var(--navy-300)] overflow-hidden rounded-full"
                      style={{
                        left: `${10 + i * 20 + 5}%`,
                        width: `${20 - 10}%`,
                      }}
                    >
                      {/* Glare sweep animation - flows left to right sequentially */}
                      <div
                        className="absolute h-full w-[200%] -left-[50%]"
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, transparent 35%, rgba(255,255,255,0.9) 50%, transparent 65%, transparent 100%)',
                          animation: 'glareFlow 4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                          animationDelay: `${i * 0.5}s`,
                          willChange: 'transform',
                          backfaceVisibility: 'hidden',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <style jsx>{`
                  @keyframes glareFlow {
                    0% { transform: translateX(0%) translateZ(0); }
                    30% { transform: translateX(100%) translateZ(0); }
                    100% { transform: translateX(100%) translateZ(0); }
                  }
                `}</style>
              </div>
            </div>

            {/* Mobile Flow - Vertical timeline */}
            <div className="md:hidden">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--navy-300)] via-[var(--ukraine-500)] to-[var(--navy-300)]" />

                {processSteps.map((step, index) => (
                  <div key={step.key} className="flex items-start gap-4 relative mb-6 last:mb-0">
                    {/* Icon circle */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-14 h-14 rounded-full bg-[var(--navy-700)] flex items-center justify-center shadow-lg ring-4 ring-[var(--cream-100)]">
                        <svg className="w-7 h-7 text-[var(--cream-100)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.icon} />
                        </svg>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="pt-2 flex-1">
                      <span className="text-sm font-semibold text-[var(--navy-700)] block">
                        {t(`transparency.processStep${step.key}Title`)}
                      </span>
                      <span className="text-xs text-[var(--navy-500)] mt-1 block leading-relaxed">
                        {t(`transparency.processStep${step.key}Text`)}
                      </span>
                    </div>
                    {/* Arrow to next step */}
                    {index < processSteps.length - 1 && (
                      <div className="absolute left-[26px] bottom-[-12px] z-20">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 0 L12 6 L8 6 L8 12 L4 12 L4 6 L0 6 Z" fill="var(--ukraine-500)" transform="rotate(180 6 6)" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Project Categories */}
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
          </section>

          {/* 5. Our Partners */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('transparency.partnersTitle')}
            </h2>
            <p className="text-base leading-relaxed mb-6">
              {t('transparency.partnersText')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {partners.map((partner) => (
                <a
                  key={partner.name}
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-4 bg-white rounded-lg border border-[var(--cream-200)] hover:border-[var(--cream-400)] hover:shadow-sm transition-all group"
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>

          {/* 6. FAQ Section */}
          <section className="bg-[var(--cream-100)] rounded-xl p-6 border border-[var(--cream-300)]">
            <h2 className="text-2xl font-semibold text-[var(--navy-700)] mb-4">
              {t('transparency.faqTitle')}
            </h2>
            <div>
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>
        </div>

        {/* CTA Buttons */}
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
