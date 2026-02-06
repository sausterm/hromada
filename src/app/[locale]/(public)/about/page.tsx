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

          {/* 2. How It Works */}
          <section className="mb-12 overflow-hidden">
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-8 text-center">
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
                        className="absolute h-full w-[30px] animate-glare-flow"
                        style={{
                          left: '-30px',
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
                          animationDelay: `${i * 0.7}s`,
                        }}
                      />
                    </div>
                  ))}
                </div>
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

          <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

          {/* 3. Project Categories */}
          <section className="mb-12">
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-3 text-center">
              {t('about.projectCategories')}
            </h2>
            <p className="text-base leading-relaxed mb-4">
              {t('about.categoryIntro')}
            </p>
            <ul className="space-y-3 text-base leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(199, 91, 57, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#C75B39' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
                  </svg>
                </span>
                <span><strong>{t('categories.HOSPITAL')}</strong> — {t('about.categoryHospital')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(123, 158, 107, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#7B9E6B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
                  </svg>
                </span>
                <span><strong>{t('categories.SCHOOL')}</strong> — {t('about.categorySchool')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(91, 143, 168, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#5B8FA8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
                  </svg>
                </span>
                <span><strong>{t('categories.WATER')}</strong> — {t('about.categoryWater')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(212, 149, 74, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#D4954A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <span><strong>{t('categories.ENERGY')}</strong> — {t('about.categoryEnergy')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(139, 115, 85, 0.15)' }}>
                  <svg className="w-3.5 h-3.5" style={{ color: '#8B7355' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>
                  </svg>
                </span>
                <span><strong>{t('categories.OTHER')}</strong> — {t('about.categoryOther')}</span>
              </li>
            </ul>

            {/* Civilian Infrastructure note */}
            <div className="mt-6 pt-6 border-t border-[var(--cream-300)] flex items-start gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 18v-7" />
                <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" />
                <path d="M14 18v-7" />
                <path d="M18 18v-7" />
                <path d="M3 22h18" />
                <path d="M6 18v-7" />
              </svg>
              <p className="text-sm leading-relaxed text-[var(--navy-600)]">
                <strong className="text-[var(--navy-700)]">{t('transparency.civilianOnlyTitle')}:</strong> {t('transparency.civilianOnlyText')}
              </p>
            </div>
          </section>

          <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

          {/* 4. Our Partners */}
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

          <hr className="border-[var(--cream-300)] mb-12 w-24 mx-auto" />

          {/* 5. FAQ */}
          <section className="mb-12">
            <h2 className="text-3xl font-medium text-[var(--navy-700)] mb-4 text-center">
              {t('transparency.faqTitle')}
            </h2>
            <div>
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
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
            <Button variant="primary" className="bg-[var(--navy-700)] hover:bg-[var(--navy-800)] w-[170px]">
              {t('about.browseProjects')}
            </Button>
          </Link>
          <Link href="/submit-project">
            <Button variant="outline" className="w-[170px]">
              {t('nav.submitProject')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
