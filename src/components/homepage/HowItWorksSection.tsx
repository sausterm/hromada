'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users, SearchCheck, Megaphone, Heart, Send, Wrench, SolarPanel, type LucideIcon } from 'lucide-react'

const STEPS: { number: number; titleKey: string; descKey: string; hexColor: string; Icon: LucideIcon }[] = [
  {
    number: 1,
    titleKey: 'homepage.howItWorks.step1Title',
    descKey: 'homepage.howItWorks.step1Desc',
    hexColor: '#5B8FA8',
    Icon: Users,
  },
  {
    number: 2,
    titleKey: 'homepage.howItWorks.step2Title',
    descKey: 'homepage.howItWorks.step2Desc',
    hexColor: '#7B9E6B',
    Icon: SearchCheck,
  },
  {
    number: 3,
    titleKey: 'homepage.howItWorks.step3Title',
    descKey: 'homepage.howItWorks.step3Desc',
    hexColor: '#8B7355',
    Icon: Megaphone,
  },
  {
    number: 4,
    titleKey: 'homepage.howItWorks.step4Title',
    descKey: 'homepage.howItWorks.step4Desc',
    hexColor: '#D4954A',
    Icon: Heart,
  },
  {
    number: 5,
    titleKey: 'homepage.howItWorks.step5Title',
    descKey: 'homepage.howItWorks.step5Desc',
    hexColor: '#C75B39',
    Icon: Send,
  },
  {
    number: 6,
    titleKey: 'homepage.howItWorks.step6Title',
    descKey: 'homepage.howItWorks.step6Desc',
    hexColor: '#6B8E9E',
    Icon: Wrench,
  },
  {
    number: 7,
    titleKey: 'homepage.howItWorks.step7Title',
    descKey: 'homepage.howItWorks.step7Desc',
    hexColor: '#4A7C59',
    Icon: SolarPanel,
  },
]

const CATEGORIES = [
  {
    key: 'HOSPITAL',
    aboutKey: 'about.categoryHospital',
    color: '#C75B39',
    bgOpacity: '0.15',
    icon: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>,
    icon2: <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>,
  },
  {
    key: 'SCHOOL',
    aboutKey: 'about.categorySchool',
    color: '#7B9E6B',
    bgOpacity: '0.15',
    icon: <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>,
    icon2: <><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></>,
  },
  {
    key: 'WATER',
    aboutKey: 'about.categoryWater',
    color: '#5B8FA8',
    bgOpacity: '0.15',
    icon: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>,
  },
  {
    key: 'ENERGY',
    aboutKey: 'about.categoryEnergy',
    color: '#D4954A',
    bgOpacity: '0.15',
    icon: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>,
  },
  {
    key: 'OTHER',
    aboutKey: 'about.categoryOther',
    color: '#8B7355',
    bgOpacity: '0.15',
    icon: <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>,
    icon2: <><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></>,
  },
]

export function HowItWorksSection() {
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" className="fade-in-section pt-4 pb-16 md:pt-8 md:pb-24 bg-[var(--cream-100)]">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <h2 className="font-logo text-2xl md:text-3xl font-semibold tracking-tight text-[var(--navy-700)] mb-12 text-center">
          {t('homepage.howItWorks.title')}
        </h2>

        <div ref={containerRef}>
          {STEPS.map((step, index) => (
            <div
              key={step.number}
              className="flex gap-5"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.6s ease ${index * 0.18}s, transform 0.6s ease ${index * 0.18}s`,
              }}
            >
              {/* Left column: icon + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-md"
                  style={{ backgroundColor: step.hexColor }}
                >
                  <step.Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                {index < STEPS.length - 1 && (
                  <div className="w-0.5 bg-[var(--cream-300)] flex-1 min-h-[16px] my-1.5" />
                )}
              </div>

              {/* Right column: title top-aligned with icon, desc below */}
              <div className={index < STEPS.length - 1 ? 'pb-6' : ''}>
                <h3 className="font-semibold text-[var(--navy-700)] text-base leading-tight -mt-px">{t(step.titleKey)}</h3>
                <p className="text-[var(--navy-500)] text-sm mt-0.5 leading-relaxed">{t(step.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.6s ease ${STEPS.length * 0.18 + 0.1}s, transform 0.6s ease ${STEPS.length * 0.18 + 0.1}s`,
          }}
        >
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-[var(--cream-200)] shadow-lg sm:flex-1">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-[var(--navy-700)] font-semibold text-sm">{t('homepage.howItWorks.promiseTitle')}</div>
              <div className="text-xs text-[var(--navy-500)]">{t('homepage.howItWorks.promiseDesc')}</div>
            </div>
          </div>

          <a
            href="https://app.candid.org/profile/16026326/pocacito-network/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl border border-[var(--cream-200)] shadow-lg hover:shadow-xl transition-shadow sm:flex-1"
          >
            <img src="/partners/candidseal.png" alt="Candid Platinum Seal" className="w-10 h-10 object-contain flex-shrink-0" />
            <div className="text-left">
              <div className="text-[var(--navy-700)] font-semibold text-sm">501(c)(3) Fiscal Sponsor</div>
              <div className="text-xs text-[var(--navy-500)]">POCACITO Network · Candid Platinum Seal</div>
            </div>
          </a>
        </div>

        {/* Project Categories */}
        <div className="mt-16 max-w-2xl mx-auto text-left">
          <h3 className="text-xl font-semibold text-[var(--navy-700)] mb-2 text-center">
            {t('about.projectCategories')}
          </h3>
          <p className="text-sm text-[var(--navy-500)] mb-6 text-center">
            {t('about.categoryIntro')}
          </p>
          <ul className="space-y-3 text-base leading-relaxed text-[var(--navy-600)]">
            {CATEGORIES.map((cat) => (
              <li key={cat.key} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `rgba(${hexToRgb(cat.color)}, ${cat.bgOpacity})` }}>
                  <svg className="w-3.5 h-3.5" style={{ color: cat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {cat.icon}
                    {cat.icon2}
                  </svg>
                </span>
                <span><strong>{t(`categories.${cat.key}`)}</strong> — {t(cat.aboutKey)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-6 border-t border-[var(--cream-300)] flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 18v-7" /><path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" />
            </svg>
            <p className="text-sm leading-relaxed text-[var(--navy-600)]">
              <strong className="text-[var(--navy-700)]">{t('transparency.civilianOnlyTitle')}:</strong> {t('transparency.civilianOnlyText')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
